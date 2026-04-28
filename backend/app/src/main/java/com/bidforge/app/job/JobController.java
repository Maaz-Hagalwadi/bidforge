package com.bidforge.app.job;

import com.bidforge.app.job.dto.request.CreateJobRequest;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private User resolveOptionalUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof User u) return u;
        return null;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public JobResponse createJob(@Valid @RequestBody CreateJobRequest request) {
        return jobService.createJob(request, getCurrentUser());
    }

    /** Browse — freelancers and unauthenticated users only. */
    @GetMapping
    @PreAuthorize("hasRole('FREELANCER') or isAnonymous()")
    public Page<JobResponse> getJobs(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minBudget,
            @RequestParam(required = false) Double maxBudget,
            @RequestParam(required = false) String skills,
            @RequestParam(required = false) String deadline,
            @RequestParam(required = false) String keyword,
            Pageable pageable,
            Authentication authentication
    ) {
        return jobService.getBrowseJobs(
                resolveOptionalUser(authentication),
                category, minBudget, maxBudget, skills, deadline, keyword,
                pageable
        );
    }

    /** Single job — public endpoint; access rules applied in service. */
    @GetMapping("/{id}")
    public JobResponse getJobById(@PathVariable UUID id, Authentication authentication) {
        return jobService.getJobById(id, resolveOptionalUser(authentication));
    }

    /** Client's own jobs — all statuses. */
    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public List<JobResponse> getMyJobs() {
        return jobService.getClientJobs(getCurrentUser());
    }

    /** Invite a freelancer to an INVITE_ONLY job. */
    @PostMapping("/{jobId}/invite/{freelancerId}")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void inviteFreelancer(@PathVariable UUID jobId, @PathVariable Long freelancerId) {
        jobService.inviteFreelancer(jobId, freelancerId, getCurrentUser());
    }
}
