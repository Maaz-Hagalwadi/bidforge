package com.bidforge.contract.milestone;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.kafka.KafkaNotificationProducer;
import com.bidforge.contract.common.exception.AccessDeniedException;
import com.bidforge.contract.common.exception.ContractNotFoundException;
import com.bidforge.contract.contract.Contract;
import com.bidforge.contract.contract.ContractRepository;
import com.bidforge.contract.milestone.dto.CreateMilestoneRequest;
import com.bidforge.contract.milestone.dto.MilestoneResponse;
import com.bidforge.contract.milestone.dto.MilestoneSummary;
import com.bidforge.contract.payment.Payment;
import com.bidforge.contract.payment.PaymentRepository;
import com.bidforge.contract.payment.PaymentStatus;
import com.bidforge.contract.payment.StripeService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final KafkaNotificationProducer kafkaNotificationProducer;
    private final StripeService stripeService;

    @Transactional
    public void createMilestones(UUID contractId, List<CreateMilestoneRequest> requests, UserInfo client) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        if (!contract.getClientId().equals(client.id())) {
            throw new AccessDeniedException("Not your contract");
        }

        for (var r : requests) {
            milestoneRepository.save(Milestone.builder()
                    .contract(contract)
                    .title(r.getTitle())
                    .description(r.getDescription())
                    .amount(r.getAmount())
                    .dueDate(r.getDueDate())
                    .status(MilestoneStatus.PENDING)
                    .funded(false)
                    .build());
        }

        kafkaNotificationProducer.send(
                contract.getFreelancerId(), contract.getFreelancerEmail(),
                "Milestones Added",
                requests.size() + " milestone(s) were added to your contract.",
                "MILESTONE_CREATED",
                contractId
        );
    }

    @Transactional
    public List<MilestoneResponse> getMilestonesByContract(UUID contractId, UserInfo user) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        boolean isClient = contract.getClientId().equals(user.id());
        boolean isFreelancer = contract.getFreelancerId().equals(user.id());
        if (!isClient && !isFreelancer) throw new AccessDeniedException("Not allowed");

        return milestoneRepository.findByContract(contract).stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public List<MilestoneResponse> getFreelancerMilestones(UserInfo freelancer) {
        return milestoneRepository.findByContractFreelancerId(freelancer.id())
                .stream().map(this::mapToResponse).toList();
    }

    // Fund milestone — in production this would verify a Stripe PaymentIntent.
    // Simplified here: client calls PATCH /milestones/{id}/fund and it's immediately escrowed.
    @Transactional
    public void fundMilestone(UUID id, UserInfo client) {
        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClientId().equals(client.id())) throw new AccessDeniedException("Not your milestone");
        if (m.isFunded()) throw new IllegalStateException("Already funded");

        m.setFunded(true);
        m.setStatus(MilestoneStatus.FUNDED);
        milestoneRepository.save(m);

        String intentId = stripeService.createPaymentIntent(m.getAmount(), "usd");

        Payment payment = Payment.builder()
                .milestone(m)
                .amount(m.getAmount())
                .status(PaymentStatus.ESCROWED)
                .stripePaymentIntentId(intentId)
                .build();
        paymentRepository.save(payment);

        kafkaNotificationProducer.send(
                m.getContract().getFreelancerId(), m.getContract().getFreelancerEmail(),
                "Milestone Funded",
                "\"" + m.getTitle() + "\" has been funded and is ready to start.",
                "MILESTONE_FUNDED",
                m.getContract().getId()
        );
    }

    @Transactional
    public void submitMilestone(UUID id, UserInfo freelancer) {
        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.isFunded()) throw new IllegalStateException("Milestone not funded");
        if (!m.getContract().getFreelancerId().equals(freelancer.id())) throw new AccessDeniedException("Not your milestone");

        m.setStatus(MilestoneStatus.SUBMITTED);
        milestoneRepository.save(m);

        kafkaNotificationProducer.send(
                m.getContract().getClientId(), m.getContract().getClientEmail(),
                "Work Submitted",
                "\"" + m.getTitle() + "\" has been submitted for your review.",
                "MILESTONE_SUBMITTED",
                m.getContract().getId()
        );
    }

    @Transactional
    public void approveMilestone(UUID id, UserInfo client) {
        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClientId().equals(client.id())) throw new AccessDeniedException("Not your milestone");
        if (m.getStatus() != MilestoneStatus.SUBMITTED) throw new IllegalStateException("Milestone not submitted");

        m.setStatus(MilestoneStatus.APPROVED);
        milestoneRepository.save(m);

        Payment payment = paymentRepository.findByMilestone(m)
                .orElseThrow(() -> new RuntimeException("Payment not found"));
        payment.setStatus(PaymentStatus.RELEASED);
        paymentRepository.save(payment);

        stripeService.releasePayment(payment.getStripePaymentIntentId());

        kafkaNotificationProducer.send(
                m.getContract().getFreelancerId(), m.getContract().getFreelancerEmail(),
                "Milestone Approved",
                "\"" + m.getTitle() + "\" was approved. Payment is being released.",
                "MILESTONE_APPROVED",
                m.getContract().getId()
        );
    }

    public MilestoneSummary getSummaryForClient(UserInfo client) {
        return buildSummary(milestoneRepository.findByContractClientId(client.id()));
    }

    public MilestoneSummary getSummaryForFreelancer(UserInfo freelancer) {
        return buildSummary(milestoneRepository.findByContractFreelancerId(freelancer.id()));
    }

    private MilestoneSummary buildSummary(List<Milestone> list) {
        return MilestoneSummary.builder()
                .total(list.size())
                .funded(list.stream().filter(Milestone::isFunded).count())
                .submitted(list.stream().filter(m -> m.getStatus() == MilestoneStatus.SUBMITTED).count())
                .approved(list.stream().filter(m -> m.getStatus() == MilestoneStatus.APPROVED).count())
                .totalAmount(list.stream().mapToDouble(Milestone::getAmount).sum())
                .releasedAmount(list.stream().filter(m -> m.getStatus() == MilestoneStatus.APPROVED).mapToDouble(Milestone::getAmount).sum())
                .build();
    }

    private MilestoneResponse mapToResponse(Milestone m) {
        return MilestoneResponse.builder()
                .id(m.getId())
                .title(m.getTitle())
                .description(m.getDescription())
                .amount(m.getAmount())
                .dueDate(m.getDueDate())
                .status(m.getStatus())
                .funded(m.isFunded())
                .contractId(m.getContract().getId())
                .jobTitle(m.getContract().getJobTitle())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
