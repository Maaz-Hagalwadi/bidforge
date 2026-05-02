package com.bidforge.app.job;

import com.bidforge.app.bid.BidRepository;
import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.common.exception.UserNotFoundException;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.job.dto.request.CreateJobRequest;
import com.bidforge.app.job.dto.request.UpdateJobRequest;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.job_invite.InviteStatus;
import com.bidforge.app.job_invite.JobInvite;
import com.bidforge.app.job_invite.JobInviteRepository;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.Pageable;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobService {

    private final JobRepository jobRepository;
    private final JobInviteRepository jobInviteRepository;
    private final JobInvitationRepository jobInvitationRepository;
    private final UserRepository userRepository;
    private final BidRepository bidRepository;
    private final ContractRepository contractRepository;

    public JobResponse createJob(CreateJobRequest request, User client) {
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
                .client(client)
                .build();

        return mapToResponse(jobRepository.save(job));
    }

    /** Returns all jobs owned by the client — newest first, enriched with bid count and assigned freelancer. */
    @Transactional(readOnly = true)
    public List<JobResponse> getClientJobs(User client) {
        return jobRepository.findByClientOrderByCreatedAtDesc(client)
                .stream()
                .map(job -> {
                    JobResponse r = mapToResponse(job);
                    r.setBidsCount(bidRepository.findByJob(job).size());
                    if (job.getStatus() == JobStatus.ASSIGNED || job.getStatus() == JobStatus.COMPLETED) {
                        contractRepository.findByJob(job)
                                .ifPresent(c -> r.setAssignedFreelancerName(c.getFreelancer().getName()));
                    }
                    return r;
                })
                .toList();
    }

    /**
     * Browse endpoint — visibility rules:
     * - Unauthenticated → OPEN + PUBLIC only
     * - Freelancer       → OPEN + PUBLIC  +  OPEN + INVITE_ONLY where invited
     * - Client           → OPEN + PUBLIC, excluding their own jobs
     */
    public Page<JobResponse> getBrowseJobs(
            User caller,
            String category,
            Double minBudget,
            Double maxBudget,
            String skills,
            String deadline,
            String keyword,
            String postedAfter,
            Pageable pageable
    ) {
        Specification<Job> spec;

        if (caller == null) {
            spec = JobSpecification.isOpenAndPublic();
        } else if (caller.getRole() == Role.FREELANCER) {

            List<UUID> invitedIds = jobInviteRepository
                    .findJobIdsByFreelancerId(caller.getId());

            spec = JobSpecification.isOpenAndVisible(invitedIds);

        } else if (caller.getRole() == Role.CLIENT) {

            spec = JobSpecification.isOpenAndPublic()
                    .and(JobSpecification.excludeClientJobs(caller.getId()));
        } else {
            spec = JobSpecification.isOpenAndPublic();
        }

        if (category != null && !category.isBlank()) {
            spec = spec.and(JobSpecification.hasCategory(category));
        }
        if (minBudget != null) {
            spec = spec.and(JobSpecification.hasMinBudget(minBudget));
        }
        if (maxBudget != null) {
            spec = spec.and(JobSpecification.hasMaxBudget(maxBudget));
        }
        if (skills != null && !skills.isBlank()) {
            spec = spec.and(JobSpecification.hasSkills(skills));
        }
        if (deadline != null && !deadline.isBlank()) {
            spec = spec.and(JobSpecification.hasDeadlineBefore(deadline));
        }
        if (keyword != null && !keyword.isBlank()) {
            spec = spec.and(JobSpecification.keywordSearch(keyword));
        }
        if (postedAfter != null && !postedAfter.isBlank()) {
            spec = spec.and(JobSpecification.postedAfter(java.time.LocalDateTime.parse(postedAfter)));
        }

        return jobRepository.findAll(spec, pageable).map(this::mapToResponse);
    }

    /**
     * Single job access rules:
     * - Owner always allowed
     * - Freelancer: OPEN + PUBLIC, or OPEN + INVITE_ONLY if invited
     * - Client (non-owner): OPEN + PUBLIC only
     * - Unauthenticated: OPEN + PUBLIC only
     */
    public JobResponse getJobById(UUID id, User caller) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (caller != null && job.getClient().getId().equals(caller.getId())) {
            return mapToResponse(job);
        }

        if (job.getStatus() != JobStatus.OPEN) {
            throw new AccessDeniedException("Job is not publicly accessible");
        }

        if (job.getVisibility() == Visibility.PUBLIC) {
            return mapToResponse(job);
        }

        // INVITE_ONLY — freelancer must be invited
        if (caller != null && caller.getRole() == Role.FREELANCER
                && jobInviteRepository.existsByJobAndFreelancer(job, caller)) {
            return mapToResponse(job);
        }

        throw new AccessDeniedException("You are not invited to view this job");
    }

    /**
     * Client invites a freelancer to an INVITE_ONLY job they own.
     */
    public void inviteFreelancer(UUID jobId, Long freelancerId, User client) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        // 🔒 Only owner
        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }

        // 🔒 Only invite-only jobs
        if (job.getVisibility() != Visibility.INVITE_ONLY) {
            throw new IllegalStateException("Invites allowed only for invite-only jobs");
        }

        User freelancer = userRepository.findById(freelancerId)
                .orElseThrow(() -> new UserNotFoundException("Freelancer not found"));

        if (freelancer.getRole() != Role.FREELANCER) {
            throw new IllegalArgumentException("Target user is not a freelancer");
        }

        // ✅ Avoid duplicate
        if (jobInviteRepository.existsByJobAndFreelancer(job, freelancer)) {
            return;
        }

        JobInvite invite = JobInvite.builder()
                .job(job)
                .freelancer(freelancer)
                .status(InviteStatus.INVITED)
                .build();

        jobInviteRepository.save(invite);
    }

    @Transactional
    public JobResponse updateJob(UUID id, UpdateJobRequest request, User client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }
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
    public void archiveJob(UUID id, User client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }
        if (job.getStatus() == JobStatus.COMPLETED) {
            throw new AccessDeniedException("Cannot archive a completed job");
        }

        job.setStatus(JobStatus.CANCELLED);
        jobRepository.save(job);
    }

    @Transactional
    public JobResponse repostJob(UUID id, User client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));
        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }
        if (job.getStatus() != JobStatus.CANCELLED) {
            throw new IllegalStateException("Only archived jobs can be reposted");
        }
        job.setStatus(JobStatus.OPEN);
        return mapToResponse(jobRepository.save(job));
    }

    @Transactional
    public void deleteJob(UUID id, User client) {
        Job job = jobRepository.findById(id)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));
        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }
        if (job.getStatus() != JobStatus.CANCELLED) {
            throw new IllegalStateException("Only archived jobs can be deleted");
        }
        bidRepository.deleteAll(bidRepository.findByJob(job));
        jobInviteRepository.deleteAll(jobInviteRepository.findByJob(job));
        jobInvitationRepository.deleteAll(jobInvitationRepository.findByJob(job));
        jobRepository.delete(job);
    }

    public List<JobResponse> getAllJobsAdmin() {
        return jobRepository.findAll().stream().map(this::mapToResponse).toList();
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
                .clientId(job.getClient().getId())
                .clientName(job.getClient().getName())
                .createdAt(job.getCreatedAt())
                .updatedAt(job.getUpdatedAt())
                .build();
    }
}
