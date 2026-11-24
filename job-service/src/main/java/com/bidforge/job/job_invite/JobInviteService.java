package com.bidforge.job.job_invite;

import com.bidforge.job.auth.AuthServiceClient;
import com.bidforge.job.auth.UserInfo;
import com.bidforge.job.kafka.KafkaNotificationProducer;
import com.bidforge.job.common.exception.AccessDeniedException;
import com.bidforge.job.common.exception.InviteAlreadyProcessedException;
import com.bidforge.job.common.exception.InviteNotFoundException;
import com.bidforge.job.common.exception.JobNotFoundException;
import com.bidforge.job.job.Job;
import com.bidforge.job.job.JobRepository;
import com.bidforge.job.job.dto.response.JobResponse;
import com.bidforge.job.job.enums.Visibility;
import com.bidforge.job.job_invite.dto.InviteWithJobResponse;
import com.bidforge.job.job_invite.dto.JobInviteStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Comparator;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class JobInviteService {

    private final JobRepository jobRepository;
    private final JobInviteRepository jobInviteRepository;
    private final AuthServiceClient authServiceClient;
    private final KafkaNotificationProducer kafkaNotificationProducer;

    public void inviteFreelancers(UUID jobId, List<Long> freelancerIds, UserInfo client) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) {
            throw new AccessDeniedException("You are not allowed to invite for this job");
        }

        if (job.getVisibility() != Visibility.INVITE_ONLY) {
            throw new IllegalStateException("Invites allowed only for invite-only jobs");
        }

        for (Long freelancerId : freelancerIds) {
            if (jobInviteRepository.existsByJobAndFreelancerId(job, freelancerId)) continue;

            // Look up freelancer details from auth-service
            UserInfo freelancer = authServiceClient.getUserById(freelancerId);
            if (freelancer == null) continue;

            JobInvite invite = JobInvite.builder()
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
    }

    public void acceptInvite(UUID inviteId, UserInfo freelancer) {
        JobInvite invite = jobInviteRepository
                .findByIdAndFreelancerId(inviteId, freelancer.id())
                .orElseThrow(() -> new InviteNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.INVITED) {
            throw new InviteAlreadyProcessedException("Invite already processed");
        }

        invite.setStatus(InviteStatus.ACCEPTED);
        jobInviteRepository.save(invite);
    }

    public void declineInvite(UUID inviteId, UserInfo freelancer) {
        JobInvite invite = jobInviteRepository
                .findByIdAndFreelancerId(inviteId, freelancer.id())
                .orElseThrow(() -> new InviteNotFoundException("Invite not found"));

        if (invite.getStatus() != InviteStatus.INVITED) {
            throw new InviteAlreadyProcessedException("Invite already processed");
        }

        invite.setStatus(InviteStatus.DECLINED);
        jobInviteRepository.save(invite);
    }

    public List<JobResponse> getMyInvites(UserInfo freelancer) {
        return jobInviteRepository
                .findByFreelancerIdAndStatus(freelancer.id(), InviteStatus.INVITED)
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
                            .clientId(job.getClientId())
                            .createdAt(job.getCreatedAt())
                            .updatedAt(job.getUpdatedAt())
                            .build();
                })
                .toList();
    }

    public List<JobInviteStatusResponse> getJobInvites(UUID jobId, UserInfo client) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");

        return jobInviteRepository.findByJobOrderByInvitedAtDesc(job)
                .stream()
                .map(invite -> JobInviteStatusResponse.builder()
                        .inviteId(invite.getId())
                        .jobId(job.getId())
                        .jobTitle(job.getTitle())
                        .freelancerId(invite.getFreelancerId())
                        .freelancerName(invite.getFreelancerName())
                        .freelancerEmail(invite.getFreelancerEmail())
                        .status(invite.getStatus())
                        .invitedAt(invite.getInvitedAt())
                        .build())
                .toList();
    }

    public List<JobInviteStatusResponse> getAllClientInvites(UserInfo client) {
        return jobRepository.findByClientId(client.id())
                .stream()
                .flatMap(job -> jobInviteRepository.findByJobOrderByInvitedAtDesc(job)
                        .stream()
                        .map(invite -> JobInviteStatusResponse.builder()
                                .inviteId(invite.getId())
                                .jobId(job.getId())
                                .jobTitle(job.getTitle())
                                .freelancerId(invite.getFreelancerId())
                                .freelancerName(invite.getFreelancerName())
                                .freelancerEmail(invite.getFreelancerEmail())
                                .status(invite.getStatus())
                                .invitedAt(invite.getInvitedAt())
                                .build()))
                .sorted(Comparator.comparing(JobInviteStatusResponse::getInvitedAt).reversed())
                .toList();
    }

    public List<InviteWithJobResponse> getMyInvitesWithStatus(UserInfo freelancer) {
        return jobInviteRepository
                .findByFreelancerId(freelancer.id())
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
                            .clientId(job.getClientId())
                            .createdAt(job.getCreatedAt())
                            .updatedAt(job.getUpdatedAt())
                            .build();
                })
                .toList();
    }
}
