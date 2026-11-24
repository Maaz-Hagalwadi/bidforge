package com.bidforge.contract.kafka;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class KafkaNotificationProducer {

    private final KafkaTemplate<String, NotificationEvent> kafkaTemplate;
    private static final String TOPIC = "notification-events";

    public void send(Long userId, String userEmail, String title, String message, String type, UUID referenceId) {
        NotificationEvent event = new NotificationEvent(
                userId, userEmail, title, message, type,
                referenceId != null ? referenceId.toString() : ""
        );
        kafkaTemplate.send(TOPIC, userId.toString(), event)
                .whenComplete((result, ex) -> {
                    if (ex != null) log.warn("Failed to send notification event: type={} userId={} error={}", type, userId, ex.getMessage());
                    else log.info("Notification event sent: type={} userId={}", type, userId);
                });
    }
}
