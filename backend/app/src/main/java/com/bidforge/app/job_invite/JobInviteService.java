package com.bidforge.app.job_invite;

import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.InviteAlreadyProcessedException;
import com.bidforge.app.common.exception.InviteNotFoundException;
import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
@Service
@RequiredArgsConstructor
public class JobInviteService {

    private final JobRepository jobRepository;
    private final UserRepository userRepository;
    private final JobInviteRepository jobInviteRepository;

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

    // 👉 Get invited jobs (freelancer) — returns full job data
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
}