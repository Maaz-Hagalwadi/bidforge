package com.bidforge.app.dispute;

import com.bidforge.app.contract.Contract;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.dispute.dto.DisputeResponse;
import com.bidforge.app.dispute.dto.OpenDisputeRequest;
import com.bidforge.app.user.User;
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

        return mapToResponse(disputeRepository.save(dispute));
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
        return mapToResponse(disputeRepository.save(dispute));
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
