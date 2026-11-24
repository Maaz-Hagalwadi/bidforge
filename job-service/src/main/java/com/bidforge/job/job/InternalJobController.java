package com.bidforge.job.job;

import com.bidforge.job.common.exception.JobNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

// Internal endpoints — called only by other services, not exposed to users
@Slf4j
@RestController
@RequestMapping("/internal/jobs")
@RequiredArgsConstructor
public class InternalJobController {

    private final JobRepository jobRepository;

    @PostMapping("/{jobId}/complete")
    public void markJobCompleted(@PathVariable UUID jobId) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));
        job.setStatus(com.bidforge.job.job.enums.JobStatus.COMPLETED);
        jobRepository.save(job);
        log.info("Job marked COMPLETED by contract-service: jobId={}", jobId);
    }
}
