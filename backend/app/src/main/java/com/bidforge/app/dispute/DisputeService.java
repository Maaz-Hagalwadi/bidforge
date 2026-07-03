package com.bidforge.app.dispute;

import com.bidforge.app.contract.Contract;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.dispute.dto.DisputeResponse;
import com.bidforge.app.dispute.dto.OpenDisputeRequest;
import com.bidforge.app.notification.EmailService;
import com.bidforge.app.notification.NotificationService;
import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DisputeService {

    private final DisputeRepository disputeRepository;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;

    public DisputeResponse openDispute(UUID contractId, OpenDisputeRequest request, User caller) {
        Contract contract = contractRepository.findById(contractId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Contract not found"));

        boolean isParty = contract.getClient().getId().equals(caller.getId())
            || contract.getFreelancer().getId().equals(caller.getId());
        if (!isParty) throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Not a party to this contract");

        if (contract.getStatus().name().equals("COMPLETED") || contract.getStatus().name().equals("CANCELLED"))
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot dispute a completed or cancelled contract");

        if (disputeRepository.existsByContractIdAndOpenedById(contractId, caller.getId()))
            throw new ResponseStatusException(HttpStatus.CONFLICT, "You already have an open dispute for this contract");

        Dispute dispute = Dispute.builder()
            .contract(contract)
            .openedBy(caller)
            .reason(request.getReason())
            .status(DisputeStatus.OPEN)
            .build();

        DisputeResponse response = mapToResponse(disputeRepository.save(dispute));
        String jobTitle = contract.getJob().getTitle();
        userRepository.findByRole(Role.ADMIN).forEach(admin -> {
            notificationService.createNotification(admin,
                    "New Dispute Opened",
                    caller.getName() + " opened a dispute on \"" + jobTitle + "\".",
                    NotificationType.DISPUTE_OPENED, response.getId());
            emailService.sendDisputeOpenedAdminEmail(admin.getEmail(), caller.getName(), jobTitle, response.getId());
        });
        return response;
    }

    public List<DisputeResponse> getMyDisputes(User caller) {
        return disputeRepository.findByOpenedByIdOrderByCreatedAtDesc(caller.getId())
            .stream().map(this::mapToResponse).collect(Collectors.toList());
    }

    public DisputeResponse resolveDispute(UUID disputeId, String resolutionNote, User admin) {
        Dispute dispute = disputeRepository.findById(disputeId)
            .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolutionNote(resolutionNote);
        dispute.setResolvedAt(java.time.LocalDateTime.now());
        DisputeResponse response = mapToResponse(disputeRepository.save(dispute));

        String jobTitle = dispute.getContract().getJob().getTitle();
        User client = dispute.getContract().getClient();
        User freelancer = dispute.getContract().getFreelancer();

        notificationService.createNotification(client,
                "Dispute Resolved",
                "The dispute for \"" + jobTitle + "\" has been resolved.",
                NotificationType.DISPUTE_RESOLVED,
                response.getId());
        notificationService.createNotification(freelancer,
                "Dispute Resolved",
                "The dispute for \"" + jobTitle + "\" has been resolved.",
                NotificationType.DISPUTE_RESOLVED,
                response.getId());
        emailService.sendDisputeResolvedEmail(client.getEmail(), client.getName(), jobTitle, resolutionNote);
        emailService.sendDisputeResolvedEmail(freelancer.getEmail(), freelancer.getName(), jobTitle, resolutionNote);

        return response;
    }

    private DisputeResponse mapToResponse(Dispute d) {
        return DisputeResponse.builder()
            .id(d.getId())
            .contractId(d.getContract().getId())
            .jobTitle(d.getContract().getJob().getTitle())
            .openedById(d.getOpenedBy().getId())
            .openedByName(d.getOpenedBy().getName())
            .reason(d.getReason())
            .status(d.getStatus())
            .resolutionNote(d.getResolutionNote())
            .resolvedAt(d.getResolvedAt())
            .createdAt(d.getCreatedAt())
            .build();
    }
}
