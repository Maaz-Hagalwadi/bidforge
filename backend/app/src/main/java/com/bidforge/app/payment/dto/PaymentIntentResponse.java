package com.bidforge.app.payment.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;

@Getter
@AllArgsConstructor
public class PaymentIntentResponse {
    private String clientSecret;
    private Double amount;
}
