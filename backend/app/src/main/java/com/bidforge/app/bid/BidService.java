package com.bidforge.app.bid;

import com.bidforge.app.bid.dto.BidResponse;
import com.bidforge.app.bid.dto.CreateBidRequest;
import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.BidAlreadyExistsException;
import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.job_invite.InviteStatus;
import com.bidforge.app.job_invite.JobInvite;
import com.bidforge.app.job_invite.JobInviteRepository;
import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final JobRepository jobRepository;
    private final JobInviteRepository jobInviteRepository;

    public BidResponse createBid(UUID jobId, CreateBidRequest request, User freelancer) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (job.getStatus() != JobStatus.OPEN) {
            throw new IllegalStateException("Cannot bid on closed job");
        }

        if (bidRepository.existsByJobAndFreelancer(job, freelancer)) {
            throw new BidAlreadyExistsException("You already placed a bid");
        }

        if (job.getVisibility() == Visibility.INVITE_ONLY) {

            JobInvite invite = jobInviteRepository
                    .findByJobAndFreelancer(job, freelancer)
                    .orElseThrow(() ->
                            new AccessDeniedException("You are not invited to this job")
                    );

            if (invite.getStatus() != InviteStatus.ACCEPTED) {
                throw new AccessDeniedException("Accept invite before bidding");
            }
        }

        Bid bid = Bid.builder()
                .amount(request.getAmount())
                .proposal(request.getProposal())
                .deliveryDays(request.getDeliveryDays())
                .job(job)
                .freelancer(freelancer)
                .build();

        Bid saved = bidRepository.save(bid);

        return mapToResponse(saved);
    }

    private BidResponse mapToResponse(Bid bid) {
        return BidResponse.builder()
                .id(bid.getId())
                .amount(bid.getAmount())
                .proposal(bid.getProposal())
                .deliveryDays(bid.getDeliveryDays())
                .jobId(bid.getJob().getId())
                .freelancerId(bid.getFreelancer().getId())
                .freelancerName(bid.getFreelancer().getName())
                .createdAt(bid.getCreatedAt())
                .updatedAt(bid.getUpdatedAt())
                .build();
    }
}
