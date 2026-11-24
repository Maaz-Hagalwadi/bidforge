package com.bidforge.notification.kafka;

import com.bidforge.notification.notification.NotificationService;
import com.bidforge.notification.notification.NotificationType;
import com.bidforge.notification.notification.dto.CreateNotificationRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

import java.util.UUID;

@Slf4j
@Component
@RequiredArgsConstructor
public class NotificationEventConsumer {

    private final NotificationService notificationService;

    @KafkaListener(topics = "notification-events", groupId = "notification-service")
    public void consume(NotificationEvent event) {
        log.info("Received notification event: type={} userId={}", event.type(), event.userId());
        notificationService.createNotification(new CreateNotificationRequest(
                event.userId(),
                event.userEmail(),
                event.title(),
                event.message(),
                NotificationType.valueOf(event.type()),
                event.referenceId().isBlank() ? null : UUID.fromString(event.referenceId())
        ));
    }
}
