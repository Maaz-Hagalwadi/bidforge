package com.bidforge.app.admin.dto;

import com.bidforge.app.payment.PaymentStatus;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class AdminPaymentResponse {
    private UUID id;
    private String milestoneTitle;
    private UUID contractId;
    private String clientName;
    private String freelancerName;
    private Double amount;
    private PaymentStatus status;
    private LocalDateTime createdAt;
}
