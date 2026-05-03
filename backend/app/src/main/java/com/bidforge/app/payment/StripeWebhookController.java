package com.bidforge.app.payment;

import com.bidforge.app.milestone.MilestoneService;
import com.bidforge.app.user.User;
import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.stripe.model.EventDataObjectDeserializer;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@Slf4j
@RestController
@RequestMapping("/webhooks/stripe")
@RequiredArgsConstructor
public class StripeWebhookController {

    @Value("${stripe.webhook-secret}")
    private String webhookSecret;

    private final MilestoneService milestoneService;
    private final StripeService stripeService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    @PostMapping("/connect/account")
    @PreAuthorize("hasRole('FREELANCER')")
    public String createAccount() throws Exception {
        return stripeService.createConnectedAccount(getCurrentUser());
    }

    @GetMapping("/connect/onboarding")
    @PreAuthorize("hasRole('FREELANCER')")
    public String onboardingLink() throws Exception {
        User user = getCurrentUser();

        if (user.getStripeAccountId() == null) {
            throw new RuntimeException("Create Stripe account first");
        }

        return stripeService.createAccountLink(user.getStripeAccountId());
    }

    @PostMapping
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader("Stripe-Signature") String sigHeader
    ) {

        Event event;

        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body("Invalid signature");
        }

        log.info("Stripe event received: {}", event.getType());

        if ("payment_intent.succeeded".equals(event.getType())) {

            EventDataObjectDeserializer data = event.getDataObjectDeserializer();

            PaymentIntent intent = (PaymentIntent) data.getObject().orElse(null);

            if (intent != null) {

                String milestoneId = intent.getMetadata().get("milestoneId");

                log.info("Payment succeeded for milestone: {}", milestoneId);

                milestoneService.handlePaymentSuccess(
                        UUID.fromString(milestoneId),
                        intent.getId()
                );
            }
        }

        return ResponseEntity.ok("success");
    }
}