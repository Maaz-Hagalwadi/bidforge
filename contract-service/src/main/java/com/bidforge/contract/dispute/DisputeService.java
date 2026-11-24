package com.bidforge.contract.dispute;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.common.exception.AccessDeniedException;
import com.bidforge.contract.common.exception.ContractNotFoundException;
import com.bidforge.contract.contract.Contract;
import com.bidforge.contract.contract.ContractRepository;
import com.bidforge.contract.dispute.dto.DisputeResponse;
import com.bidforge.contract.dispute.dto.OpenDisputeRequest;
import com.bidforge.contract.dispute.dto.ResolveDisputeRequest;
import com.bidforge.contract.kafka.KafkaNotificationProducer;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final ContractRepository contractRepository;
    private final KafkaNotificationProducer kafkaNotificationProducer;

    @Transactional
    public DisputeResponse openDispute(UUID contractId, OpenDisputeRequest req, UserInfo user) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        boolean isClient = contract.getClientId().equals(user.id());
        boolean isFreelancer = contract.getFreelancerId().equals(user.id());

        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("You are not a party to this contract");
        }

        Dispute dispute = Dispute.builder()
                .contract(contract)
                .raisedById(user.id())
                .raisedByEmail(user.email())
                .raisedByName(user.name())
                .reason(req.getReason())
                .description(req.getDescription())
                .status(DisputeStatus.OPEN)
                .build();

        Dispute saved = disputeRepository.save(dispute);
        log.info("Dispute opened: disputeId={} contractId={} raisedById={}", saved.getId(), contractId, user.id());

        // Notify the other party
        if (isClient) {
            kafkaNotificationProducer.send(
                    contract.getFreelancerId(), contract.getFreelancerEmail(),
                    "Dispute Opened",
                    "A dispute has been raised on contract \"" + contract.getJobTitle() + "\".",
                    "DISPUTE_OPENED",
                    saved.getId()
            );
        } else {
            kafkaNotificationProducer.send(
                    contract.getClientId(), contract.getClientEmail(),
                    "Dispute Opened",
                    "A dispute has been raised on contract \"" + contract.getJobTitle() + "\".",
                    "DISPUTE_OPENED",
                    saved.getId()
            );
        }

        return mapToResponse(saved);
    }

    public List<DisputeResponse> getMyDisputes(UserInfo user) {
        return disputeRepository.findByContractClientIdOrContractFreelancerId(user.id(), user.id())
                .stream().map(this::mapToResponse).toList();
    }

    @Transactional
    public DisputeResponse resolveDispute(UUID disputeId, ResolveDisputeRequest req, UserInfo user) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));

        Contract contract = dispute.getContract();
        boolean isClient = contract.getClientId().equals(user.id());
        boolean isFreelancer = contract.getFreelancerId().equals(user.id());

        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("You are not a party to this contract");
        }

        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolution(req.getResolution());
        dispute.setResolvedAt(LocalDateTime.now());
        Dispute saved = disputeRepository.save(dispute);

        log.info("Dispute resolved: disputeId={} resolvedBy={}", disputeId, user.id());
        return mapToResponse(saved);
    }

    public DisputeResponse mapToResponse(Dispute d) {
        return DisputeResponse.builder()
                .id(d.getId())
                .contractId(d.getContract().getId())
                .raisedById(d.getRaisedById())
                .raisedByName(d.getRaisedByName())
                .reason(d.getReason())
                .description(d.getDescription())
                .status(d.getStatus())
                .resolution(d.getResolution())
                .resolvedAt(d.getResolvedAt())
                .createdAt(d.getCreatedAt())
                .build();
    }
}
