package com.bidforge.app.admin.dto;

import com.bidforge.app.dispute.DisputeStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminDisputeResponse {
    private UUID id;
    private UUID contractId;
    private String jobTitle;
    private String openedByName;
    private String reason;
    private DisputeStatus status;
    private String resolutionNote;
    private LocalDateTime createdAt;
}
