package com.bidforge.app.bid;

import com.bidforge.app.bid.dto.BidResponse;
import com.bidforge.app.bid.dto.CreateBidRequest;
import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.common.exception.BidAlreadyExistsException;
import com.bidforge.app.common.exception.BidNotFoundException;
import com.bidforge.app.common.exception.JobNotFoundException;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.job_invite.InviteStatus;
import com.bidforge.app.job_invite.JobInvite;
import com.bidforge.app.job_invite.JobInviteRepository;
import com.bidforge.app.user.User;
import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
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
                .status(BidStatus.PENDING)
                .build();

        Bid saved = bidRepository.save(bid);

        return mapToResponse(saved);
    }

    public List<BidResponse> getBidsForJob(UUID jobId, User client) {

        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }

        return bidRepository.findByJob(job)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToResponse)
                .toList();
    }

    public List<BidResponse> getMyBids(User freelancer) {
        return bidRepository.findByFreelancer(freelancer)
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToResponse)
                .toList();
    }

    public void declineBid(UUID bidId, User client) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new BidNotFoundException("Bid not found"));

        Job job = bid.getJob();

        if (!job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }

        if (bid.getStatus() != BidStatus.PENDING) {
            throw new IllegalStateException("Can only decline a pending bid");
        }

        bid.setStatus(BidStatus.REJECTED);
        bidRepository.save(bid);
    }

    @Transactional
    public void acceptBid(UUID bidId, User client) {

        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new BidNotFoundException("Bid not found"));

        Job job = bid.getJob();

        System.out.println("Bid ID: " + bidId);
        System.out.println("Job: " + bid.getJob());
        System.out.println("Client: " + client.getId());

        // 🔒 Ownership check
        if (job.getClient() == null || !job.getClient().getId().equals(client.getId())) {
            throw new AccessDeniedException("You do not own this job");
        }

        // 🔒 Only OPEN jobs
        if (job.getStatus() != JobStatus.OPEN) {
            throw new IllegalStateException("Job is not open");
        }


        // Accept selected bid
        bid.setStatus(BidStatus.ACCEPTED);

        // Reject others
        List<Bid> allBids = bidRepository.findByJob(job);
        for (Bid b : allBids) {
            if (!b.getId().equals(bidId)) {
                b.setStatus(BidStatus.REJECTED);
            }
        }

        // 🔥 Update job status
        job.setStatus(JobStatus.ASSIGNED);

        bidRepository.saveAll(allBids);
    }



    private BidResponse mapToResponse(Bid bid) {
        return BidResponse.builder()
                .id(bid.getId())
                .amount(bid.getAmount())
                .proposal(bid.getProposal())
                .deliveryDays(bid.getDeliveryDays())
                .jobId(bid.getJob().getId())
                .jobTitle(bid.getJob().getTitle())
                .jobStatus(bid.getJob().getStatus().name())
                .freelancerId(bid.getFreelancer().getId())
                .freelancerName(bid.getFreelancer().getName())
                .status(bid.getStatus())
                .createdAt(bid.getCreatedAt())
                .updatedAt(bid.getUpdatedAt())
                .build();
    }
}
