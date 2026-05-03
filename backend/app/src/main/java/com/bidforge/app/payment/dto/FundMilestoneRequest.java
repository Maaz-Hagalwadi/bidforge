package com.bidforge.app.payment.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class FundMilestoneRequest {
    private String paymentIntentId;
}
