package com.bidforge.app.contract.dto;

import com.bidforge.app.contract.ContractStatus;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
public class ContractResponse {

    private UUID id;
    private UUID jobId;
    private Long clientId;
    private Long freelancerId;
    private Double amount;
    private ContractStatus status;
    private String submissionNote;
    private String submissionUrl;
    private LocalDateTime submittedAt;
    private LocalDateTime createdAt;
    private String revisionNote;
    private LocalDateTime revisionRequestedAt;
    private String jobTitle;
    private String deadline;
    private String clientName;
    private String freelancerName;
    private Integer deliveryDays;
    private boolean reviewedByClient;
    private boolean reviewedByFreelancer;
}
