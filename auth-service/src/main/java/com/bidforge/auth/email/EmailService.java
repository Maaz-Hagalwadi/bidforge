package com.bidforge.auth.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Service
public class EmailService {

    private final Resend resend;
    private final TemplateEngine templateEngine;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.test-mode:false}")
    private boolean testMode;

    public EmailService(@Value("${resend.api-key:}") String apiKey, TemplateEngine templateEngine) {
        this.resend = apiKey.isBlank() ? null : new Resend(apiKey);
        this.templateEngine = templateEngine;
    }

    @Async
    public void sendVerificationEmail(String to, String name, String verifyUrl) {
        if (testMode || resend == null) {
            log.info("[TEST MODE] Verify email: {}", verifyUrl);
            return;
        }
        Context ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("verifyUrl", verifyUrl);
        send(to, "Verify Your BidForge Email", templateEngine.process("email/verify-email", ctx));
    }

    @Async
    public void sendForgotPasswordEmail(String to, String name, String resetUrl) {
        if (testMode || resend == null) {
            log.info("[TEST MODE] Password reset link: {}", resetUrl);
            return;
        }
        Context ctx = new Context();
        ctx.setVariable("name", name);
        ctx.setVariable("resetUrl", resetUrl);
        send(to, "Reset Your BidForge Password", templateEngine.process("email/forgot-password", ctx));
    }

    @Async
    public void sendLoginNotification(String to, String name) {
        send(to, "New Login to BidForge", notification(
                "Security Alert", "New Login Detected",
                "Hi " + name + ", a new login was detected on your BidForge account.",
                null, "If this wasn't you, please change your password immediately."));
    }

    @Async
    public void sendOtpEmail(String to, String otp) {
        Context ctx = new Context();
        ctx.setVariable("otp", otp);
        send(to, "Your BidForge Login OTP", templateEngine.process("email/login-otp", ctx));
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

    private void send(String to, String subject, String html) {
        if (testMode || resend == null) {
            log.info("[TEST MODE] Email to={} subject=\"{}\"", to, subject);
            return;
        }
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(from).to(to).subject(subject).html(html).build();
            resend.emails().send(params);
        } catch (ResendException e) {
            log.error("Failed to send email to {}: {}", to, e.getMessage());
        }
    }
}
