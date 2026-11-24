package com.bidforge.notification.email;

import com.resend.Resend;
import com.resend.core.exception.ResendException;
import com.resend.services.emails.model.CreateEmailOptions;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;

@Slf4j
@Service
public class EmailService {

    private final Resend resend;

    @Value("${app.mail.from}")
    private String from;

    @Value("${app.mail.test-mode:true}")
    private boolean testMode;

    public EmailService(@Value("${resend.api-key:}") String apiKey) {
        this.resend = apiKey.isBlank() ? null : new Resend(apiKey);
    }

    @Async
    public void sendNotificationEmail(String to, String title, String message) {
        if (testMode || resend == null) {
            log.info("[TEST MODE] Email to={} subject=\"{}\"", to, title);
            return;
        }
        String html = "<div style='font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px'>" +
                "<div style='background:#0059bb;padding:16px 24px;border-radius:8px 8px 0 0'>" +
                "<h2 style='color:#fff;margin:0'>BidForge</h2></div>" +
                "<div style='background:#f8fafc;padding:24px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 8px 8px'>" +
                "<h3 style='color:#0a192f;margin-top:0'>" + escapeHtml(title) + "</h3>" +
                "<p style='color:#475569;line-height:1.6'>" + escapeHtml(message) + "</p>" +
                "<hr style='border:none;border-top:1px solid #e2e8f0;margin:20px 0'/>" +
                "<p style='color:#94a3b8;font-size:12px;margin:0'>You received this because you have notifications enabled on BidForge.</p>" +
                "</div></div>";
        try {
            CreateEmailOptions params = CreateEmailOptions.builder()
                    .from(from).to(to).subject(title).html(html).build();
            resend.emails().send(params);
        } catch (ResendException e) {
            log.error("Failed to send notification email to {}: {}", to, e.getMessage());
        }
    }

    private String escapeHtml(String s) {
        if (s == null) return "";
        return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;");
    }
}
