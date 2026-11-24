package com.bidforge.job.job;

import com.bidforge.job.auth.UserInfo;
import com.bidforge.job.job.dto.request.CreateJobRequest;
import com.bidforge.job.job.dto.request.UpdateJobRequest;
import com.bidforge.job.job.dto.response.JobResponse;
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

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private UserInfo resolveOptionalUser(Authentication auth) {
        if (auth != null && auth.getPrincipal() instanceof UserInfo u) return u;
        return null;
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public JobResponse createJob(@Valid @RequestBody CreateJobRequest request) {
        return jobService.createJob(request, getCurrentUser());
    }

    @GetMapping
    @PreAuthorize("hasRole('FREELANCER') or isAnonymous()")
    public Page<JobResponse> getJobs(
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Double minBudget,
            @RequestParam(required = false) Double maxBudget,
            @RequestParam(required = false) String skills,
            @RequestParam(required = false) String deadline,
            @RequestParam(required = false) String keyword,
            @RequestParam(required = false) String postedAfter,
            @RequestParam(required = false) String experienceLevel,
            @RequestParam(required = false) String urgencyLevel,
            Pageable pageable,
            Authentication authentication
    ) {
        return jobService.getBrowseJobs(
                resolveOptionalUser(authentication),
                category, minBudget, maxBudget, skills, deadline, keyword, postedAfter,
                experienceLevel, urgencyLevel,
                pageable
        );
    }

    @GetMapping("/{id}")
    public JobResponse getJobById(@PathVariable UUID id, Authentication authentication) {
        return jobService.getJobById(id, resolveOptionalUser(authentication));
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public List<JobResponse> getMyJobs() {
        return jobService.getClientJobs(getCurrentUser());
    }

    @PostMapping("/{jobId}/invite/{freelancerId}")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void inviteFreelancer(@PathVariable UUID jobId, @PathVariable Long freelancerId) {
        jobService.inviteFreelancer(jobId, freelancerId, getCurrentUser());
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    public JobResponse updateJob(@PathVariable UUID id, @Valid @RequestBody UpdateJobRequest request) {
        return jobService.updateJob(id, request, getCurrentUser());
    }

    @PatchMapping("/{id}/archive")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void archiveJob(@PathVariable UUID id) {
        jobService.archiveJob(id, getCurrentUser());
    }

    @PostMapping("/{id}/repost")
    @PreAuthorize("hasRole('CLIENT')")
    public JobResponse repostJob(@PathVariable UUID id) {
        return jobService.repostJob(id, getCurrentUser());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('CLIENT')")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteJob(@PathVariable UUID id) {
        jobService.deleteJob(id, getCurrentUser());
    }
}
