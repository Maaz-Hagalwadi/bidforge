package com.bidforge.app.job_invite;

import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.InviteAlreadyProcessedException;
import com.bidforge.app.notification.NotificationService;
import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.common.exception.InviteNotFoundException;
import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.job_invite.dto.InviteWithJobResponse;
import com.bidforge.app.job_invite.dto.JobInviteStatusResponse;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class JobInviteService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JobInviteRepository jobInviteRepository;
    private final NotificationService notificationService;

    // 👉 Invite freelancers
    public void inviteFreelancers(UUID jobId, List<Long> freelancerIds, User client) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        // 🔒 Only owner can invite
        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You are not allowed to invite for this job");
        }

        // 🔒 Only invite-only jobs
        if (job.getVisibility() != Visibility.INVITE_ONLY) {
            throw new IllegalStateException("Invites allowed only for invite-only jobs");
        }

        for (Long freelancerId : freelancerIds) {

            User freelancer = userRepository.findById(freelancerId)
                    .orElseThrow(() -> new RuntimeException("Freelancer not found"));

            // avoid duplicate invites
            if (jobInviteRepository.existsByJobAndFreelancer(job, freelancer)) {
                continue;
            }

            JobInvite invite = JobInvite.builder()
                    .job(job)
                    .freelancer(freelancer)
                    .status(InviteStatus.INVITED)
                    .build();

            jobInviteRepository.save(invite);

            notificationService.createNotification(
                    freelancer,
                    "Job Invitation",
                    "You've been invited to bid on \"" + job.getTitle() + "\"",
                    NotificationType.JOB_INVITED,
                    job.getId()
            );
        }
    }

    public void acceptInvite(UUID inviteId, User freelancer) {

        JobInvite invite = jobInviteRepository
                .findByIdAndFreelancer(inviteId, freelancer)
                .orElseThrow(() -> new InviteNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.INVITED) {
            throw new InviteAlreadyProcessedException("Invite already processed");
        }

        invite.setStatus(InviteStatus.ACCEPTED);
        jobInviteRepository.save(invite);
    }

    public void declineInvite(UUID inviteId, User freelancer) {

        JobInvite invite = jobInviteRepository
                .findByIdAndFreelancer(inviteId, freelancer)
                .orElseThrow(() -> new InviteNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.INVITED) {
            throw new InviteAlreadyProcessedException("Invite already processed");
        }

        invite.setStatus(InviteStatus.DECLINED);
        jobInviteRepository.save(invite);
    }

    // 👉 Get invited jobs (freelancer) — returns full job data (INVITED only, legacy)
    public List<JobResponse> getMyInvites(User freelancer) {

        return jobInviteRepository
                .findByFreelancerAndStatus(freelancer, InviteStatus.INVITED)
                .stream()
                .map(invite -> {
                    Job job = invite.getJob();
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
                            .clientId(job.getClient().getId())
                            .createdAt(job.getCreatedAt())
                            .updatedAt(job.getUpdatedAt())
                            .build();
                })
                .toList();
    }

    // 👉 Client: see all invites for a job they own, with freelancer names + statuses
    public List<JobInviteStatusResponse> getJobInvites(UUID jobId, User client) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }

        return jobInviteRepository.findByJobOrderByInvitedAtDesc(job)
                .stream()
                .map(invite -> JobInviteStatusResponse.builder()
                        .inviteId(invite.getId())
                        .jobId(job.getId())
                        .jobTitle(job.getTitle())
                        .freelancerId(invite.getFreelancer().getId())
                        .freelancerName(invite.getFreelancer().getName())
                        .freelancerEmail(invite.getFreelancer().getEmail())
                        .status(invite.getStatus())
                        .invitedAt(invite.getInvitedAt())
                        .build())
                .toList();
    }

    // 👉 Client: see all invites across all their jobs (aggregated)
    public List<JobInviteStatusResponse> getAllClientInvites(User client) {

        return jobRepository.findByClient(client)
                .stream()
                .flatMap(job -> jobInviteRepository.findByJobOrderByInvitedAtDesc(job)
                        .stream()
                        .map(invite -> JobInviteStatusResponse.builder()
                                .inviteId(invite.getId())
                                .jobId(job.getId())
                                .jobTitle(job.getTitle())
                                .freelancerId(invite.getFreelancer().getId())
                                .freelancerName(invite.getFreelancer().getName())
                                .freelancerEmail(invite.getFreelancer().getEmail())
                                .status(invite.getStatus())
                                .invitedAt(invite.getInvitedAt())
                                .build()))
                .sorted(Comparator.comparing(JobInviteStatusResponse::getInvitedAt).reversed())
                .toList();
    }

    // 👉 Get all invites with status (INVITED/ACCEPTED/DECLINED) + full job data — newest first
    public List<InviteWithJobResponse> getMyInvitesWithStatus(User freelancer) {

        return jobInviteRepository
                .findByFreelancer(freelancer)
                .stream()
                .sorted(Comparator.comparing(JobInvite::getInvitedAt).reversed())
                .map(invite -> {
                    Job job = invite.getJob();
                    return InviteWithJobResponse.builder()
                            .inviteId(invite.getId())
                            .inviteStatus(invite.getStatus())
                            .jobId(job.getId())
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
                            .clientId(job.getClient().getId())
                            .createdAt(job.getCreatedAt())
                            .updatedAt(job.getUpdatedAt())
                            .build();
                })
                .toList();
    }
}