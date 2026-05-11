package com.bidforge.app.dispute.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class OpenDisputeRequest {
    @NotBlank(message = "Reason is required")
    @Size(min = 20, max = 2000, message = "Reason must be 20–2000 characters")
    private String reason;
}
