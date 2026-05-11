package com.bidforge.app.dispute.dto;

import com.bidforge.app.dispute.DisputeStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class DisputeResponse {
    private UUID id;
    private UUID contractId;
    private String jobTitle;
    private Long openedById;
    private String openedByName;
    private String reason;
    private DisputeStatus status;
    private String resolutionNote;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
}
