package com.bidforge.contract.contract.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

// Received at POST /internal/contracts — called by job-service when a bid is accepted
@Getter
@Setter
public class CreateContractRequest {
    private UUID jobId;
    private String jobTitle;
    private Long clientId;
    private String clientEmail;
    private String clientName;
    private Long freelancerId;
    private String freelancerEmail;
    private String freelancerName;
    private Double agreedAmount;
    private Integer deliveryDays;
}
