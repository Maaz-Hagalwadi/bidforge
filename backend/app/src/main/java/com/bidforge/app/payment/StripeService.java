package com.bidforge.app.payment;

import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import com.stripe.Stripe;
import com.stripe.exception.StripeException;
import com.stripe.model.Account;
import com.stripe.model.AccountLink;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import com.stripe.param.AccountCreateParams;
import com.stripe.param.AccountLinkCreateParams;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.TransferCreateParams;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.UUID;

@Service
public class StripeService {


    @Value("${stripe.secret-key}")
    private String secretKey;

    @Value("${app.base-url:http://localhost:3000}")
    private String appBaseUrl;

    @PostConstruct
    public void init() {
        Stripe.apiKey = secretKey;
    }

    private final UserRepository userRepository;

    public StripeService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    public PaymentIntent createPaymentIntent(Double amountDollars, UUID milestoneId) throws StripeException {
        long amountCents = Math.round(amountDollars * 100);
        PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency("usd")
                .putMetadata("milestoneId", milestoneId.toString())
                .build();
        return PaymentIntent.create(params);
    }

    public void transferToFreelancer(Double amountDollars, String stripeAccountId) throws StripeException {
        long amountCents = Math.round(amountDollars * 100);
        TransferCreateParams params = TransferCreateParams.builder()
                .setAmount(amountCents)
                .setCurrency("usd")
                .setDestination(stripeAccountId)
                .build();
        Transfer.create(params);
    }

    public String createConnectedAccount(User freelancer) throws StripeException {
        AccountCreateParams params = AccountCreateParams.builder()
                .setType(AccountCreateParams.Type.EXPRESS)
                .setEmail(freelancer.getEmail())
                .setCapabilities(
                        AccountCreateParams.Capabilities.builder()
                                .setTransfers(AccountCreateParams.Capabilities.Transfers.builder()
                                        .setRequested(true)
                                        .build())
                                .build()
                )
                .build();

        Account account = Account.create(params);
        freelancer.setStripeAccountId(account.getId());
        userRepository.save(freelancer);
        return account.getId();
    }

    public String createAccountLink(String accountId) throws StripeException {
        AccountLinkCreateParams params = AccountLinkCreateParams.builder()
                .setAccount(accountId)
                .setRefreshUrl(appBaseUrl + "/reauth")
                .setReturnUrl(appBaseUrl + "/onboarding-complete")
                .setType(AccountLinkCreateParams.Type.ACCOUNT_ONBOARDING)
                .build();
        return AccountLink.create(params).getUrl();
    }

    public void refundPaymentIntent(String paymentIntentId) throws StripeException {
        RefundCreateParams params = RefundCreateParams.builder()
                .setPaymentIntent(paymentIntentId)
                .build();
        Refund.create(params);
    }

    public boolean isPaymentSucceeded(String paymentIntentId) throws StripeException {
        PaymentIntent intent = PaymentIntent.retrieve(paymentIntentId);
        return "succeeded".equals(intent.getStatus());
    }




}
