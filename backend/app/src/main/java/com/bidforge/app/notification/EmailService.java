package com.bidforge.app.notification;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;
import java.util.UUID;

@Slf4j
@Service
public class EmailService {

    private final Resend resend;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.test-mode:true}")
    private boolean testMode;

    @Value("${app.mail.test-email:maaz.hagalwadi570@gmail.com}")
    private String testEmail;

    public EmailService(@Value("${resend.api-key}") String apiKey, TemplateEngine templateEngine) {
        this.resend = new Resend(apiKey);
        this.templateEngine = templateEngine;
    }

    @Async
    public void sendWelcomeEmail(String to, String name) {
        Context ctx = new Context();
        ctx.setVariable("name", name);
        String html = templateEngine.process("email/welcome", ctx);
        send(to, "Welcome to BidForge!", html);
    }

    @Async
    public void sendVerificationEmail(String to, String name, String verifyUrl) {
        Context ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("verifyUrl", verifyUrl);
        String html = templateEngine.process("email/verify-email", ctx);
        send(to, "Verify Your BidForge Email", html);
    }

    @Async
    public void sendForgotPasswordEmail(String to, String name, String resetUrl) {
        Context ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("resetUrl", resetUrl);
        String html = templateEngine.process("email/forgot-password", ctx);
        send(to, "Reset Your BidForge Password", html);
    }

    @Async
    public void sendLoginNotification(String to, String name) {
        send(to, "New Login to BidForge", notification(
                "Security Alert", "New Login Detected",
                "Hi " + name + ", a new login was detected on your BidForge account.",
                null,
                "If this wasn't you, please change your password immediately."
        ));
    }



    @Async
    public void sendBidPlacedEmail(String to, String freelancerName, String jobTitle) {
        send(to, "New Bid on Your Job", notification(
                "New Bid", "You received a new bid!",
                "A freelancer has placed a bid on your job.",
                freelancerName + " bid on: " + jobTitle,
                "Log in to review and accept or decline the bid."
        ));
    }

    @Async
    public void sendBidAcceptedEmail(String to, String freelancerName, String jobTitle) {
        send(to, "Your Bid Was Accepted!", notification(
                "Bid Accepted 🎉", "Congratulations " + freelancerName + "!",
                "Your bid has been accepted by the client.",
                "Job: " + jobTitle,
                "A contract has been created. Log in to get started."
        ));
    }

    @Async
    public void sendContractCreatedEmail(String to, String name, String jobTitle) {
        send(to, "Contract Created - " + jobTitle, notification(
                "Contract Created", "Hi " + name + ", a contract is ready.",
                "A contract has been created for the following job.",
                "Job: " + jobTitle,
                "Log in to view the full contract details."
        ));
    }

    @Async
    public void sendMilestoneFundedEmail(String to, String freelancerName, String milestoneTitle) {
        send(to, "Milestone Funded: " + milestoneTitle, notification(
                "Milestone Funded 💰", "Hi " + freelancerName + ", funds are in escrow!",
                "The client has funded a milestone. You can now start working.",
                "Milestone: " + milestoneTitle,
                null
        ));
    }

    @Async
    public void sendMilestoneSubmittedEmail(String to, String clientName, String milestoneTitle) {
        send(to, "Work Submitted for Review: " + milestoneTitle, notification(
                "Work Submitted", "Hi " + clientName + ", work is ready for review.",
                "The freelancer has submitted work for a milestone.",
                "Milestone: " + milestoneTitle,
                "Log in to review and approve or request revisions."
        ));
    }

    @Async
    public void sendMilestoneApprovedEmail(String to, String freelancerName, String milestoneTitle) {
        send(to, "Milestone Approved: " + milestoneTitle, notification(
                "Milestone Approved ✅", "Great work, " + freelancerName + "!",
                "Your milestone has been approved and payment is being released.",
                "Milestone: " + milestoneTitle,
                null
        ));
    }

    @Async
    public void sendMilestoneRejectedEmail(String to, String freelancerName, String milestoneTitle) {
        send(to, "Revision Requested: " + milestoneTitle, notification(
                "Revision Requested", "Hi " + freelancerName + ",",
                "The client has requested revisions on your submission.",
                "Milestone: " + milestoneTitle,
                "Log in to view the feedback and resubmit."
        ));
    }

    @Async
    public void sendPaymentRefundedEmail(String to, String name, String milestoneTitle) {
        send(to, "Refund Processed: " + milestoneTitle, notification(
                "Refund Processed", "Hi " + name + ",",
                "The escrow payment has been refunded.",
                "Milestone: " + milestoneTitle,
                null
        ));
    }

    @Async
    public void sendDisputeOpenedAdminEmail(String to, String openerName, String jobTitle, UUID disputeId) {
        send(to, "New Dispute Opened: " + jobTitle, notification(
                "Dispute Alert", "A new dispute has been opened.",
                openerName + " opened a dispute on contract for job: " + jobTitle,
                "Dispute ID: " + disputeId,
                "Log in to the admin panel to review and resolve."
        ));
    }

    @Async
    public void sendUserBannedEmail(String to, String userName) {
        send(to, "Your BidForge Account Has Been Suspended", notification(
                "Account Suspended", "Hi " + userName + ",",
                "Your account has been suspended by an administrator.",
                null,
                "If you believe this is a mistake, please contact support."
        ));
    }

    @Async
    public void sendUserUnbannedEmail(String to, String userName) {
        send(to, "Your BidForge Account Has Been Reinstated", notification(
                "Account Reinstated", "Hi " + userName + ",",
                "Your account suspension has been lifted. You can now log in.",
                null,
                "Welcome back to BidForge!"
        ));
    }

    @Async
    public void sendDisputeResolvedEmail(String to, String name, String jobTitle, String resolutionNote) {
        send(to, "Dispute Resolved: " + jobTitle, notification(
                "Dispute Resolved", "Hi " + name + ",",
                "The dispute for your contract has been resolved by an admin.",
                "Job: " + jobTitle,
                resolutionNote != null ? "Resolution: " + resolutionNote : null
        ));
    }

    @Async
    public void sendNewUserRegisteredAdminEmail(String to, String newUserName, String newUserEmail, String role) {
        send(to, "New User Registered: " + newUserName, notification(
                "New Registration", "A new user has registered on BidForge.",
                newUserName + " (" + newUserEmail + ") signed up as " + role + ".",
                null,
                "Log in to the admin panel to view user details."
        ));
    }

    private String notification(String badge, String heading, String body, String highlight, String subtext) {
        Context ctx = new Context();
        ctx.setVariable("badge", badge);
        ctx.setVariable("heading", heading);
        ctx.setVariable("body", body);
        ctx.setVariable("highlight", highlight);
        ctx.setVariable("subtext", subtext);
        return templateEngine.process("email/notification", ctx);
    }


    @Async
    public void sendOtpEmail(String to, String otp) {

        Context ctx = new Context();
        ctx.setVariable("otp", otp);

        String html = templateEngine.process("email/login-otp", ctx);

        send(to, "Your BidForge Login OTP", html);
    }



    private void send(String to, String subject, String html) {
        try {
            // In test mode, send all emails to the verified test email
            String recipient = testMode ? testEmail : to;
            
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(from)
                    .to(recipient)
                    .subject(subject + (testMode ? " [TEST - Original: " + to + "]" : ""))
                    .html(html)
                    .build();
            resend.emails().send(params);
            
            if (testMode) {
                log.info("Email sent in test mode to {} (original recipient: {})", recipient, to);
            }
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
