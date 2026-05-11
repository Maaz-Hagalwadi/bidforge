package com.bidforge.app.dispute;

import com.bidforge.app.dispute.dto.DisputeResponse;
import com.bidforge.app.dispute.dto.OpenDisputeRequest;
import com.bidforge.app.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeService disputeService;

    private User currentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/contracts/{contractId}/dispute")
    @ResponseStatus(HttpStatus.CREATED)
    public DisputeResponse openDispute(
        @PathVariable UUID contractId,
        @Valid @RequestBody OpenDisputeRequest request
    ) {
        return disputeService.openDispute(contractId, request, currentUser());
    }

    @GetMapping("/disputes/my")
    public List<DisputeResponse> getMyDisputes() {
        return disputeService.getMyDisputes(currentUser());
    }

    @PatchMapping("/disputes/{disputeId}/resolve")
    public DisputeResponse resolveDispute(
        @PathVariable UUID disputeId,
        @RequestBody Map<String, String> body
    ) {
        return disputeService.resolveDispute(disputeId, body.getOrDefault("resolutionNote", ""), currentUser());
    }
}
