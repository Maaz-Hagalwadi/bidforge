package com.bidforge.app.contract;

import com.bidforge.app.contract.dto.ContractResponse;
import com.bidforge.app.contract.dto.RevisionRequest;
import com.bidforge.app.contract.dto.SubmitWorkRequest;
import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
public class ContractController {

    private final ContractService contractService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    @GetMapping("/client")
    public List<ContractResponse> getClientContracts() {
        return contractService.getClientContracts(getCurrentUser());
    }

    @GetMapping("/freelancer")
    public List<ContractResponse> getFreelancerContracts() {
        return contractService.getFreelancerContracts(getCurrentUser());
    }

    @PatchMapping("/{contractId}/request-revision")
    @PreAuthorize("hasRole('CLIENT')")
    public void requestRevision(
            @PathVariable UUID contractId,
            @RequestBody RevisionRequest request
    ) {
        contractService.requestRevision(contractId, request, getCurrentUser());
    }

    @PatchMapping("/{contractId}/submit-work")
    @PreAuthorize("hasRole('FREELANCER')")
    public void submitWork(
            @PathVariable UUID contractId,
            @RequestBody SubmitWorkRequest request
    ) {
        contractService.submitWork(contractId, request, getCurrentUser());
    }

    @PatchMapping("/{contractId}/complete")
    @PreAuthorize("hasRole('CLIENT')")
    public void completeContract(@PathVariable UUID contractId) {
        contractService.completeContract(contractId, getCurrentUser());
    }
}
