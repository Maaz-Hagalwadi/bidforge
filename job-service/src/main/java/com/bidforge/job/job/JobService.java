package com.bidforge.job.job;

import com.bidforge.job.auth.AuthServiceClient;
import com.bidforge.job.auth.UserInfo;
import com.bidforge.job.bid.BidRepository;
import com.bidforge.job.kafka.KafkaNotificationProducer;
import com.bidforge.job.common.exception.AccessDeniedException;
import com.bidforge.job.common.exception.JobNotFoundException;
import com.bidforge.job.common.exception.UserNotFoundException;
import com.bidforge.job.job.dto.request.CreateJobRequest;
import com.bidforge.job.job.dto.request.UpdateJobRequest;
import com.bidforge.job.job.dto.response.JobResponse;
import com.bidforge.job.job.enums.JobStatus;
import com.bidforge.job.job.enums.Visibility;
import com.bidforge.job.job_invite.InviteStatus;
import com.bidforge.job.job_invite.JobInviteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobInviteRepository jobInviteRepository;
    private final JobInvitationRepository jobInvitationRepository;
    private final BidRepository bidRepository;
    private final AuthServiceClient authServiceClient;
    private final KafkaNotificationProducer kafkaNotificationProducer;

    public JobResponse createJob(CreateJobRequest request, UserInfo client) {
        JobStatus status = request.isDraft() ? JobStatus.DRAFT : JobStatus.OPEN;

        Job job = Job.builder()
                .title(request.getTitle())
                .category(request.getCategory())
                .description(request.getDescription())
                .requiredSkills(request.getRequiredSkills())
                .budgetType(request.getBudgetType())
                .budgetMin(request.getBudgetMin())
                .budgetMax(request.getBudgetMax())
                .deadline(request.getDeadline())
                .attachmentUrl(request.getAttachmentUrl())
                .visibility(request.getVisibility())
                .experienceLevel(request.getExperienceLevel())
                .urgencyLevel(request.getUrgencyLevel())
                .status(status)
                .clientId(client.id())
                .clientEmail(client.email())
                .clientName(client.name())
                .build();

        return mapToResponse(jobRepository.save(job));
    }

    @Transactional(readOnly = true)
    public List<JobResponse> getClientJobs(UserInfo client) {
        return jobRepository.findByClientIdOrderByCreatedAtDesc(client.id())
                .stream()
                .map(job -> {
                    JobResponse r = mapToResponse(job);
                    r.setBidsCount(bidRepository.findByJob(job).size());
                    return r;
                })
                .toList();
    }

    public Page<JobResponse> getBrowseJobs(
            UserInfo caller,
            String category,
            Double minBudget,
            Double maxBudget,
            String skills,
            String deadline,
            String keyword,
            String postedAfter,
            String experienceLevel,
            String urgencyLevel,
            Pageable pageable
    ) {
        Specification<Job> spec;

        if (caller == null) {
            spec = JobSpecification.isOpenAndPublic();
        } else if ("FREELANCER".equals(caller.role())) {
            List<UUID> invitedIds = jobInviteRepository.findJobIdsByFreelancerId(caller.id());
            spec = JobSpecification.isOpenAndVisible(invitedIds);
        } else if ("CLIENT".equals(caller.role())) {
            spec = JobSpecification.isOpenAndPublic()
                    .and(JobSpecification.excludeClientJobs(caller.id()));
        } else {
            spec = JobSpecification.isOpenAndPublic();
        }

        if (category != null && !category.isBlank()) spec = spec.and(JobSpecification.hasCategory(category));
        if (minBudget != null) spec = spec.and(JobSpecification.hasMinBudget(minBudget));
        if (maxBudget != null) spec = spec.and(JobSpecification.hasMaxBudget(maxBudget));
        if (skills != null && !skills.isBlank()) spec = spec.and(JobSpecification.hasSkills(skills));
        if (deadline != null && !deadline.isBlank()) spec = spec.and(JobSpecification.hasDeadlineBefore(deadline));
        if (keyword != null && !keyword.isBlank()) spec = spec.and(JobSpecification.keywordSearch(keyword));
        if (postedAfter != null && !postedAfter.isBlank()) spec = spec.and(JobSpecification.postedAfter(LocalDateTime.parse(postedAfter)));
        if (experienceLevel != null && !experienceLevel.isBlank()) spec = spec.and(JobSpecification.hasExperienceLevel(com.bidforge.job.job.enums.ExperienceLevel.valueOf(experienceLevel)));
        if (urgencyLevel != null && !urgencyLevel.isBlank()) spec = spec.and(JobSpecification.hasUrgencyLevel(com.bidforge.job.job.enums.UrgencyLevel.valueOf(urgencyLevel)));

        return jobRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    public JobResponse getJobById(UUID id, UserInfo caller) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (caller != null && job.getClientId().equals(caller.id())) {
            return mapToResponse(job);
        }

        if (job.getStatus() != JobStatus.OPEN) {
            throw new AccessDeniedException("Job is not publicly accessible");
        }

        if (job.getVisibility() == Visibility.PUBLIC) {
            return mapToResponse(job);
        }

        if (caller != null && "FREELANCER".equals(caller.role())
                && jobInviteRepository.existsByJobAndFreelancerId(job, caller.id())) {
            return mapToResponse(job);
        }

        throw new AccessDeniedException("You are not invited to view this job");
    }

    public void inviteFreelancer(UUID jobId, Long freelancerId, UserInfo client) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) {
            throw new AccessDeniedException("You do not own this job");
        }

        if (job.getVisibility() != Visibility.INVITE_ONLY) {
            throw new IllegalStateException("Invites allowed only for invite-only jobs");
        }

        // Key learning: to validate the freelancer, job-service calls auth-service over HTTP
        UserInfo freelancer = authServiceClient.getUserById(freelancerId);
        if (freelancer == null) throw new UserNotFoundException("Freelancer not found");
        if (!"FREELANCER".equals(freelancer.role())) throw new IllegalArgumentException("Target user is not a freelancer");

        if (jobInviteRepository.existsByJobAndFreelancerId(job, freelancerId)) return;

        com.bidforge.job.job_invite.JobInvite invite = com.bidforge.job.job_invite.JobInvite.builder()
                .job(job)
                .freelancerId(freelancerId)
                .freelancerEmail(freelancer.email())
                .freelancerName(freelancer.name())
                .status(InviteStatus.INVITED)
                .build();

        jobInviteRepository.save(invite);

        kafkaNotificationProducer.send(
                freelancerId, freelancer.email(),
                "Job Invitation",
                "You've been invited to bid on \"" + job.getTitle() + "\"",
                "JOB_INVITED",
                job.getId()
        );
    }

    @Transactional
    public JobResponse updateJob(UUID id, UpdateJobRequest request, UserInfo client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");
        if (job.getStatus() == JobStatus.COMPLETED || job.getStatus() == JobStatus.CANCELLED) {
            throw new AccessDeniedException("Cannot edit a completed or archived job");
        }

        job.setTitle(request.getTitle());
        job.setCategory(request.getCategory());
        job.setDescription(request.getDescription());
        job.setRequiredSkills(request.getRequiredSkills());
        job.setBudgetType(request.getBudgetType());
        job.setBudgetMin(request.getBudgetMin());
        job.setBudgetMax(request.getBudgetMax());
        job.setDeadline(request.getDeadline());
        job.setAttachmentUrl(request.getAttachmentUrl());
        if (request.getVisibility() != null) job.setVisibility(request.getVisibility());
        job.setExperienceLevel(request.getExperienceLevel());
        job.setUrgencyLevel(request.getUrgencyLevel());

        return mapToResponse(jobRepository.save(job));
    }

    @Transactional
    public void archiveJob(UUID id, UserInfo client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");
        if (job.getStatus() == JobStatus.COMPLETED) throw new AccessDeniedException("Cannot archive a completed job");

        job.setStatus(JobStatus.CANCELLED);
        jobRepository.save(job);
    }

    @Transactional
    public JobResponse repostJob(UUID id, UserInfo client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");
        if (job.getStatus() != JobStatus.CANCELLED) throw new IllegalStateException("Only archived jobs can be reposted");

        job.setStatus(JobStatus.OPEN);
        return mapToResponse(jobRepository.save(job));
    }

    @Transactional
    public void deleteJob(UUID id, UserInfo client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");
        if (job.getStatus() != JobStatus.CANCELLED) throw new IllegalStateException("Only archived jobs can be deleted");

        bidRepository.deleteAll(bidRepository.findByJob(job));
        jobInviteRepository.deleteAll(jobInviteRepository.findByJob(job));
        jobInvitationRepository.deleteAll(jobInvitationRepository.findByJob(job));
        jobRepository.delete(job);
    }

    private JobResponse mapToResponse(Job job) {
        return JobResponse.builder()
                .id(job.getId())
                .title(job.getTitle())
                .category(job.getCategory())
                .description(job.getDescription())
                .requiredSkills(job.getRequiredSkills())
                .budgetType(job.getBudgetType())
                .budgetMin(job.getBudgetMin())
                .budgetMax(job.getBudgetMax())
                .deadline(job.getDeadline())
                .attachmentUrl(job.getAttachmentUrl())
                .visibility(job.getVisibility())
                .status(job.getStatus())
                .experienceLevel(job.getExperienceLevel())
                .urgencyLevel(job.getUrgencyLevel())
                .clientId(job.getClientId())
                .clientName(job.getClientName())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
