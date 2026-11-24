package com.bidforge.contract.dispute.dto;

import com.bidforge.contract.dispute.DisputeStatus;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class DisputeResponse {
    private UUID id;
    private UUID contractId;
    private Long raisedById;
    private String raisedByName;
    private String reason;
    private String description;
    private DisputeStatus status;
    private String resolution;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
