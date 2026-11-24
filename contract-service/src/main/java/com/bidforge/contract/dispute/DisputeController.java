package com.bidforge.contract.dispute;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.dispute.dto.DisputeResponse;
import com.bidforge.contract.dispute.dto.OpenDisputeRequest;
import com.bidforge.contract.dispute.dto.ResolveDisputeRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/disputes")
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/contracts/{contractId}")
    public DisputeResponse openDispute(@PathVariable UUID contractId,
                                       @RequestBody OpenDisputeRequest request) {
        return disputeService.openDispute(contractId, request, getCurrentUser());
    }

    @GetMapping("/my")
    public List<DisputeResponse> getMyDisputes() {
        return disputeService.getMyDisputes(getCurrentUser());
    }

    @PatchMapping("/{disputeId}/resolve")
    public DisputeResponse resolveDispute(@PathVariable UUID disputeId,
                                          @RequestBody ResolveDisputeRequest request) {
        return disputeService.resolveDispute(disputeId, request, getCurrentUser());
    }
}
