package com.bidforge.contract.milestone;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.milestone.dto.CreateMilestoneRequest;
import com.bidforge.contract.milestone.dto.MilestoneResponse;
import com.bidforge.contract.milestone.dto.MilestoneSummary;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/milestones")
public class MilestoneController {

    private final MilestoneService milestoneService;

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/contracts/{contractId}")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.CREATED)
    public void createMilestones(@PathVariable UUID contractId, @RequestBody List<CreateMilestoneRequest> request) {
        milestoneService.createMilestones(contractId, request, getCurrentUser());
    }

    @GetMapping("/contract/{contractId}")
    public List<MilestoneResponse> getByContract(@PathVariable UUID contractId) {
        return milestoneService.getMilestonesByContract(contractId, getCurrentUser());
    }

    @GetMapping("/freelancer")
    @PreAuthorize("hasRole('FREELANCER')")
    public List<MilestoneResponse> myMilestones() {
        return milestoneService.getFreelancerMilestones(getCurrentUser());
    }

    @GetMapping("/summary/client")
    @PreAuthorize("hasRole('CLIENT')")
    public MilestoneSummary clientSummary() {
        return milestoneService.getSummaryForClient(getCurrentUser());
    }

    @GetMapping("/summary/freelancer")
    @PreAuthorize("hasRole('FREELANCER')")
    public MilestoneSummary freelancerSummary() {
        return milestoneService.getSummaryForFreelancer(getCurrentUser());
    }

    @PatchMapping("/{id}/fund")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void fund(@PathVariable UUID id) {
        milestoneService.fundMilestone(id, getCurrentUser());
    }

    @PatchMapping("/{id}/submit")
    @PreAuthorize("hasRole('FREELANCER')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void submit(@PathVariable UUID id) {
        milestoneService.submitMilestone(id, getCurrentUser());
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void approve(@PathVariable UUID id) {
        milestoneService.approveMilestone(id, getCurrentUser());
    }
}
