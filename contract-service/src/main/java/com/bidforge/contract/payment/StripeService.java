package com.bidforge.contract.payment;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.param.PaymentIntentCreateParams;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.UUID;

@Slf4j
@Service
public class StripeService {

    @Value("${stripe.secret-key:}")
    private String secretKey;

    @PostConstruct
    public void init() {
        if (secretKey != null && !secretKey.isBlank()) {
            Stripe.apiKey = secretKey;
            log.info("Stripe initialized with secret key");
        } else {
            log.warn("STRIPE_SECRET_KEY not configured — Stripe calls will return mock IDs");
        }
    }

    public String createPaymentIntent(Double amount, String currency) {
        if (secretKey == null || secretKey.isBlank()) {
            String mockId = "mock_" + UUID.randomUUID();
            log.info("Mock PaymentIntent created: {}", mockId);
            return mockId;
        }
        try {
            long amountInCents = Math.round(amount * 100);
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(currency)
                    .build();
            PaymentIntent intent = PaymentIntent.create(params);
            log.info("Stripe PaymentIntent created: id={} amount={}", intent.getId(), amountInCents);
            return intent.getId();
        } catch (Exception e) {
            log.error("Failed to create Stripe PaymentIntent: {}", e.getMessage());
            throw new RuntimeException("Stripe payment creation failed: " + e.getMessage());
        }
    }

    public void releasePayment(String paymentIntentId) {
        // Stripe Connect transfers require freelancer Connect accounts; deferring full implementation
        log.info("Payment released: {}", paymentIntentId);
    }
}
