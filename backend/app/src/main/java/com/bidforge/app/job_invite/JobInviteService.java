package com.bidforge.app.job_invite;

import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.job_invite.dto.InvitedJobResponse;
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

    // 👉 Get invited jobs (freelancer)
    public List<InvitedJobResponse> getMyInvites(User freelancer) {

        return jobInviteRepository
                .findByFreelancerAndStatus(freelancer, InviteStatus.INVITED)
                .stream()
                .map(invite -> InvitedJobResponse.builder()
                        .jobId(invite.getJob().getId())
                        .title(invite.getJob().getTitle())
                        .category(invite.getJob().getCategory())
                        .budgetMin(invite.getJob().getBudgetMin())
                        .budgetMax(invite.getJob().getBudgetMax())
                        .build()
                )
                .toList();
    }
}