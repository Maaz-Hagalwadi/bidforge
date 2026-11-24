package com.bidforge.job.admin;

import com.bidforge.job.bid.Bid;
import com.bidforge.job.bid.BidRepository;
import com.bidforge.job.bid.BidStatus;
import com.bidforge.job.bid.dto.BidResponse;
import com.bidforge.job.job.Job;
import com.bidforge.job.job.JobRepository;
import com.bidforge.job.job.dto.response.JobResponse;
import com.bidforge.job.job.enums.JobStatus;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.Map;

// Internal endpoints — called only by admin-service, not exposed via api-gateway
@RestController
@RequestMapping("/internal/admin")
@RequiredArgsConstructor
public class InternalAdminJobController {

    private final JobRepository jobRepository;
    private final BidRepository bidRepository;

    @GetMapping("/jobs")
    public Page<JobResponse> getAllJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return jobRepository.findAll(pageable).map(this::mapJob);
    }

    @GetMapping("/bids")
    public Page<BidResponse> getAllBids(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return bidRepository.findAll(pageable).map(this::mapBid);
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalJobs", jobRepository.count());
        stats.put("openJobs", jobRepository.countByStatus(JobStatus.OPEN));
        stats.put("completedJobs", jobRepository.countByStatus(JobStatus.COMPLETED));
        stats.put("totalBids", bidRepository.count());
        stats.put("pendingBids", bidRepository.countByStatus(BidStatus.PENDING));
        return stats;
    }

    private JobResponse mapJob(Job job) {
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

    private BidResponse mapBid(Bid bid) {
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
