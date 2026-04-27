package com.bidforge.app.job;

import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.job.dto.request.CreateJobRequest;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;

    public JobResponse createJob(CreateJobRequest request, User client) {

        Job job = Job.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .status(JobStatus.OPEN)
                .client(client)
                .createdAt(LocalDateTime.now())
                .build();

        Job saved = jobRepository.save(job);

        return JobResponse.builder()
                .id(saved.getId())
                .title(saved.getTitle())
                .description(saved.getDescription())
                .budgetMin(saved.getBudgetMin())
                .budgetMax(saved.getBudgetMax())
                .status(saved.getStatus())
                .build();
    }

    public List<JobResponse> getAllJobs() {
        return jobRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public JobResponse getJobById(Long id) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        return mapToResponse(job);
    }

    public List<JobResponse> getMyJobs(User client) {
        return jobRepository.findByClient(client)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private JobResponse mapToResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .description(job.getDescription())
                .budgetMin(job.getBudgetMin())
                .budgetMax(job.getBudgetMax())
                .status(job.getStatus())
                .build();
    }
}