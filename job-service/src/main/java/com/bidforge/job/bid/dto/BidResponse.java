package com.bidforge.job.bid.dto;

import com.bidforge.job.bid.BidStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class BidResponse {

    private UUID id;
    private Double amount;
    private String proposal;
    private Integer deliveryDays;
    private UUID jobId;
    private String jobTitle;
    private String jobStatus;
    private Long freelancerId;
    private String freelancerName;
    private BidStatus status;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
