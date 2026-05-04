package com.bidforge.app.milestone;

import com.bidforge.app.common.exception.ContractNotFoundException;
import com.bidforge.app.contract.Contract;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.milestone.dto.MilestoneResponse;
import com.bidforge.app.milestone.dto.MilestoneSummary;
import com.bidforge.app.payment.*;
import com.bidforge.app.payment.dto.FundMilestoneRequest;
import com.bidforge.app.payment.dto.PaymentIntentResponse;
import com.bidforge.app.notification.NotificationService;
import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.user.User;
import com.stripe.exception.StripeException;
import com.stripe.model.PaymentIntent;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import jakarta.transaction.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MilestoneService {

    private final MilestoneRepository milestoneRepository;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final StripeService stripeService;
    private final NotificationService notificationService;

    @Transactional
    public void createMilestones(UUID contractId,
                                 List<com.bidforge.app.milestone.dto.CreateMilestoneRequest> requests,
                                 User client) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        if (!contract.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Not your contract");
        }

        for (var r : requests) {
            Milestone m = Milestone.builder()
                    .contract(contract)
                    .title(r.getTitle())
                    .description(r.getDescription())
                    .amount(r.getAmount())
                    .dueDate(r.getDueDate())
                    .status(MilestoneStatus.PENDING)
                    .funded(false)
                    .build();

            milestoneRepository.save(m);
        }

        notificationService.createNotification(
                contract.getFreelancer(),
                "Milestones Added",
                requests.size() + " milestone(s) were added to your contract.",
                NotificationType.MILESTONE_CREATED,
                contractId
        );
    }

    private MilestoneSummary buildSummary(List<Milestone> list) {

        long total = list.size();
        long funded = list.stream().filter(Milestone::isFunded).count();
        long submitted = list.stream().filter(m -> m.getStatus() == MilestoneStatus.SUBMITTED).count();
        long approved = list.stream().filter(m -> m.getStatus() == MilestoneStatus.APPROVED).count();

        double totalAmount = list.stream().mapToDouble(Milestone::getAmount).sum();

        double releasedAmount = list.stream()
                .filter(m -> m.getStatus() == MilestoneStatus.APPROVED)
                .mapToDouble(Milestone::getAmount)
                .sum();

        return MilestoneSummary.builder()
                .total(total)
                .funded(funded)
                .submitted(submitted)
                .approved(approved)
                .totalAmount(totalAmount)
                .releasedAmount(releasedAmount)
                .build();
    }


    @Transactional
    public void handlePaymentSuccess(UUID milestoneId, String paymentIntentId) {

        Milestone milestone = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        // 🔒 Idempotency (CRITICAL)
        if (milestone.isFunded()) {
            return;
        }

        milestone.setFunded(true);
        milestone.setStatus(MilestoneStatus.FUNDED);
        milestoneRepository.save(milestone);

        paymentRepository.save(
                Payment.builder()
                        .milestone(milestone)
                        .stripePaymentIntentId(paymentIntentId)
                        .status(PaymentStatus.ESCROWED)
                        .build()
        );

        notificationService.createNotification(
                milestone.getContract().getFreelancer(),
                "Milestone Funded",
                "\"" + milestone.getTitle() + "\" has been funded and is ready to start.",
                NotificationType.MILESTONE_FUNDED,
                milestone.getContract().getId()
        );
    }

    public MilestoneSummary getSummaryForClient(User client) {

        List<Milestone> milestones = milestoneRepository.findAll()
                .stream()
                .filter(m -> m.getContract().getClient().getId().equals(client.getId()))
                .toList();

        return buildSummary(milestones);
    }

    public MilestoneSummary getSummaryForFreelancer(User freelancer) {

        List<Milestone> milestones = milestoneRepository.findAll()
                .stream()
                .filter(m -> m.getContract().getFreelancer().getId().equals(freelancer.getId()))
                .toList();

        return buildSummary(milestones);
    }

    public List<MilestoneResponse> getMilestonesByContract(UUID contractId, User user) {

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        boolean isClient = contract.getClient().getId().equals(user.getId());
        boolean isFreelancer = contract.getFreelancer().getId().equals(user.getId());

        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("Not allowed");
        }

        return milestoneRepository.findByContract(contract)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public List<MilestoneResponse> getFreelancerMilestones(User freelancer) {

        return milestoneRepository.findAll()
                .stream()
                .filter(m -> m.getContract().getFreelancer().getId().equals(freelancer.getId()))
                .map(this::mapToResponse)
                .toList();
    }

    public List<MilestoneResponse> getClientMilestones(User client) {

        return milestoneRepository.findAll()
                .stream()
                .filter(m -> m.getContract().getClient().getId().equals(client.getId()))
                .map(this::mapToResponse)
                .toList();
    }

    // 💳 Create Stripe PaymentIntent before card entry
    public PaymentIntentResponse createPaymentIntent(UUID milestoneId, User client) {

        Milestone m = milestoneRepository.findById(milestoneId)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Not your milestone");
        }

        if (m.isFunded()) {
            throw new IllegalStateException("Already funded");
        }

        try {
            PaymentIntent intent = stripeService.createPaymentIntent(m.getAmount(), milestoneId);
            return new PaymentIntentResponse(intent.getClientSecret(), m.getAmount());
        } catch (StripeException e) {
            throw new RuntimeException("Stripe error: " + e.getMessage(), e);
        }
    }

    // 💰 Fund milestone (Escrow) — verified via Stripe PaymentIntent
    @Transactional
    public void fundMilestone(UUID id, User client, FundMilestoneRequest request) {

        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Not your milestone");
        }

        if (m.isFunded()) {
            throw new IllegalStateException("Already funded");
        }

        try {
            if (!stripeService.isPaymentSucceeded(request.getPaymentIntentId())) {
                throw new IllegalStateException("Payment not completed");
            }
        } catch (StripeException e) {
            throw new RuntimeException("Stripe verification failed: " + e.getMessage(), e);
        }

        m.setFunded(true);
        milestoneRepository.save(m);

        Payment payment = Payment.builder()
                .milestone(m)
                .amount(m.getAmount())
                .status(PaymentStatus.ESCROWED)
                .stripePaymentIntentId(request.getPaymentIntentId())
                .createdAt(LocalDateTime.now())
                .build();

        paymentRepository.save(payment);

        notificationService.createNotification(
                m.getContract().getFreelancer(),
                "Milestone Funded",
                "\"" + m.getTitle() + "\" has been funded and is ready to start.",
                NotificationType.MILESTONE_FUNDED,
                m.getContract().getId()
        );
    }

    // 👨‍💻 Freelancer submits work
    @Transactional
    public void submitMilestone(UUID id, User freelancer) {

        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.isFunded()) {
            throw new IllegalStateException("Milestone not funded");
        }

        if (!m.getContract().getFreelancer().getId().equals(freelancer.getId())) {
            throw new AccessDeniedException("Not your milestone");
        }

        m.setStatus(MilestoneStatus.SUBMITTED);
        milestoneRepository.save(m);

        notificationService.createNotification(
                m.getContract().getClient(),
                "Work Submitted",
                "\"" + m.getTitle() + "\" has been submitted for your review.",
                NotificationType.MILESTONE_SUBMITTED,
                m.getContract().getId()
        );
    }

    // ✅ Client approves → release payment
    @Transactional
    public void approveMilestone(UUID id, User client) {

        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Not your milestone");
        }

        if (m.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new IllegalStateException("Milestone not submitted");
        }

        m.setStatus(MilestoneStatus.APPROVED);
        milestoneRepository.save(m);

        Payment payment = paymentRepository.findByMilestone(m)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        payment.setStatus(PaymentStatus.RELEASED);
        paymentRepository.save(payment);

        String freelancerStripeId = m.getContract().getFreelancer().getStripeAccountId();
        if (freelancerStripeId != null) {
            try {
                stripeService.transferToFreelancer(m.getAmount(), freelancerStripeId);
            } catch (StripeException e) {
                throw new RuntimeException("Transfer to freelancer failed: " + e.getMessage(), e);
            }
        }

        notificationService.createNotification(
                m.getContract().getFreelancer(),
                "Milestone Approved",
                "\"" + m.getTitle() + "\" was approved. Payment is being released.",
                NotificationType.MILESTONE_APPROVED,
                m.getContract().getId()
        );
    }

    @Transactional
    public void rejectMilestone(UUID id, User client) {
        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Not your milestone");
        }

        if (m.getStatus() != MilestoneStatus.SUBMITTED) {
            throw new IllegalStateException("Can only reject a submitted milestone");
        }

        m.setStatus(MilestoneStatus.REJECTED);
        milestoneRepository.save(m);

        notificationService.createNotification(
                m.getContract().getFreelancer(),
                "Milestone Rejected",
                "\"" + m.getTitle() + "\" was rejected and needs revisions.",
                NotificationType.MILESTONE_REJECTED,
                m.getContract().getId()
        );
    }

    @Transactional
    public void refundMilestone(UUID id, User client) {
        Milestone m = milestoneRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Milestone not found"));

        if (!m.getContract().getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("Not your milestone");
        }

        if (!m.isFunded()) {
            throw new IllegalStateException("Milestone is not funded");
        }

        if (m.getStatus() == MilestoneStatus.APPROVED) {
            throw new IllegalStateException("Cannot refund an already approved milestone");
        }

        Payment payment = paymentRepository.findByMilestone(m)
                .orElseThrow(() -> new RuntimeException("Payment not found"));

        if (payment.getStatus() == PaymentStatus.REFUNDED) {
            throw new IllegalStateException("Already refunded");
        }

        try {
            stripeService.refundPaymentIntent(payment.getStripePaymentIntentId());
        } catch (StripeException e) {
            throw new RuntimeException("Stripe refund failed: " + e.getMessage(), e);
        }

        payment.setStatus(PaymentStatus.REFUNDED);
        paymentRepository.save(payment);

        m.setFunded(false);
        m.setStatus(MilestoneStatus.PENDING);
        milestoneRepository.save(m);

        String msg = "Escrow for \"" + m.getTitle() + "\" has been refunded.";
        notificationService.createNotification(
                m.getContract().getClient(),
                "Milestone Refunded",
                msg,
                NotificationType.MILESTONE_REFUNDED,
                m.getContract().getId()
        );
        notificationService.createNotification(
                m.getContract().getFreelancer(),
                "Milestone Refunded",
                msg,
                NotificationType.MILESTONE_REFUNDED,
                m.getContract().getId()
        );
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
                .jobTitle(m.getContract().getJob().getTitle())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
