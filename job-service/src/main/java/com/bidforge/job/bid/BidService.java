package com.bidforge.job.bid;

import com.bidforge.job.auth.UserInfo;
import com.bidforge.job.bid.dto.BidResponse;
import com.bidforge.job.bid.dto.CreateBidRequest;
import com.bidforge.job.clients.ContractServiceClient;
import com.bidforge.job.kafka.KafkaNotificationProducer;
import com.bidforge.job.common.exception.AccessDeniedException;
import com.bidforge.job.common.exception.BidAlreadyExistsException;
import com.bidforge.job.common.exception.BidNotFoundException;
import com.bidforge.job.common.exception.JobNotFoundException;
import com.bidforge.job.job.Job;
import com.bidforge.job.job.JobRepository;
import com.bidforge.job.job.enums.JobStatus;
import com.bidforge.job.job.enums.Visibility;
import com.bidforge.job.job_invite.InviteStatus;
import com.bidforge.job.job_invite.JobInvite;
import com.bidforge.job.job_invite.JobInviteRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class BidService {

    private final BidRepository bidRepository;
    private final JobRepository jobRepository;
    private final JobInviteRepository jobInviteRepository;
    private final KafkaNotificationProducer kafkaNotificationProducer;
    private final ContractServiceClient contractServiceClient;

    public BidResponse createBid(UUID jobId, CreateBidRequest request, UserInfo freelancer) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (job.getStatus() != JobStatus.OPEN) {
            throw new IllegalStateException("Cannot bid on closed job");
        }

        if (bidRepository.existsByJobAndFreelancerId(job, freelancer.id())) {
            throw new BidAlreadyExistsException("You already placed a bid");
        }

        if (job.getVisibility() == Visibility.INVITE_ONLY) {
            JobInvite invite = jobInviteRepository
                    .findByJobAndFreelancerId(job, freelancer.id())
                    .orElseThrow(() -> new AccessDeniedException("You are not invited to this job"));

            if (invite.getStatus() != InviteStatus.ACCEPTED) {
                throw new AccessDeniedException("Accept invite before bidding");
            }
        }

        Bid bid = Bid.builder()
                .amount(request.getAmount())
                .proposal(request.getProposal())
                .deliveryDays(request.getDeliveryDays())
                .job(job)
                .freelancerId(freelancer.id())
                .freelancerEmail(freelancer.email())
                .freelancerName(freelancer.name())
                .status(BidStatus.PENDING)
                .build();

        Bid saved = bidRepository.save(bid);
        log.info("Bid placed: bidId={}, jobId={}, freelancerId={}, amount={}",
                saved.getId(), jobId, freelancer.id(), request.getAmount());

        kafkaNotificationProducer.send(
                job.getClientId(), job.getClientEmail(),
                "New Bid Received",
                "A freelancer placed a bid on your job \"" + job.getTitle() + "\"",
                "BID_PLACED",
                job.getId()
        );

        return mapToResponse(saved);
    }

    public Page<BidResponse> getBidsForJob(UUID jobId, UserInfo client, Pageable pageable) {
        Job job = jobRepository.findById(jobId)
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) {
            throw new AccessDeniedException("You do not own this job");
        }

        return bidRepository.findByJobOrderByCreatedAtDesc(job, pageable).map(this::mapToResponse);
    }

    public List<BidResponse> getMyBids(UserInfo freelancer) {
        return bidRepository.findByFreelancerId(freelancer.id())
                .stream()
                .sorted((a, b) -> b.getCreatedAt().compareTo(a.getCreatedAt()))
                .map(this::mapToResponse)
                .toList();
    }

    public void declineBid(UUID bidId, UserInfo client) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new BidNotFoundException("Bid not found"));

        Job job = bid.getJob();
        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");
        if (bid.getStatus() != BidStatus.PENDING) throw new IllegalStateException("Can only decline a pending bid");

        bid.setStatus(BidStatus.REJECTED);
        bidRepository.save(bid);
        log.info("Bid declined: bidId={}, jobId={}", bidId, job.getId());

        kafkaNotificationProducer.send(
                bid.getFreelancerId(), bid.getFreelancerEmail(),
                "Bid Declined",
                "Your bid on \"" + job.getTitle() + "\" was declined.",
                "BID_REJECTED",
                job.getId()
        );
    }

    @Transactional
    public void acceptBid(UUID bidId, UserInfo client) {
        Bid bid = bidRepository.findById(bidId)
                .orElseThrow(() -> new BidNotFoundException("Bid not found"));

        Job job = jobRepository.findByIdWithLock(bid.getJob().getId())
                .orElseThrow(() -> new JobNotFoundException("Job not found"));

        if (!job.getClientId().equals(client.id())) throw new AccessDeniedException("You do not own this job");
        if (job.getStatus() != JobStatus.OPEN) throw new IllegalStateException("Job is not open");

        bid.setStatus(BidStatus.ACCEPTED);

        List<Bid> allBids = bidRepository.findByJob(job);
        for (Bid b : allBids) {
            if (!b.getId().equals(bidId)) {
                b.setStatus(BidStatus.REJECTED);
                kafkaNotificationProducer.send(
                        b.getFreelancerId(), b.getFreelancerEmail(),
                        "Bid Not Selected",
                        "Another freelancer was selected for \"" + job.getTitle() + "\".",
                        "BID_REJECTED",
                        job.getId()
                );
            }
        }

        job.setStatus(JobStatus.ASSIGNED);
        bidRepository.saveAll(allBids);
        jobRepository.save(job);

        log.info("Bid accepted: bidId={}, jobId={}, freelancerId={}", bidId, job.getId(), bid.getFreelancerId());

        // Key learning: contract creation moved out of this method.
        // Job-service calls contract-service over HTTP to create the contract.
        // This is the cross-service trigger: job-service → contract-service
        contractServiceClient.createContract(
                job.getId(), job.getTitle(),
                job.getClientId(), job.getClientEmail(), job.getClientName(),
                bid.getFreelancerId(), bid.getFreelancerEmail(), bid.getFreelancerName(),
                bid.getAmount(), bid.getDeliveryDays()
        );

        kafkaNotificationProducer.send(
                bid.getFreelancerId(), bid.getFreelancerEmail(),
                "Bid Accepted!",
                "Your bid was accepted for \"" + job.getTitle() + "\". A contract will be created.",
                "BID_ACCEPTED",
                job.getId()
        );
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
                .freelancerId(bid.getFreelancerId())
                .freelancerName(bid.getFreelancerName())
                .status(bid.getStatus())
                .createdAt(bid.getCreatedAt())
                .updatedAt(bid.getUpdatedAt())
                .build();
    }
}
