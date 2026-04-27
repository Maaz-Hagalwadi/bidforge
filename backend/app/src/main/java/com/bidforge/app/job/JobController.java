package com.bidforge.app.job;

import com.bidforge.app.job.dto.request.CreateJobRequest;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobController {

    private final JobService jobService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    public JobResponse createJob(@Valid @RequestBody CreateJobRequest request) {
        return jobService.createJob(request, getCurrentUser());
    }

    @GetMapping
    public List<JobResponse> getAllJobs() {
        return jobService.getAllJobs();
    }

    @GetMapping("/{id}")
    public JobResponse getJobById(@PathVariable Long id) {
        return jobService.getJobById(id);
    }

    @GetMapping("/my")
    @PreAuthorize("hasRole('CLIENT')")
    public List<JobResponse> getMyJobs() {
        return jobService.getMyJobs(getCurrentUser());
    }
}