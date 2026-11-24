package com.bidforge.notification.notification;

import com.bidforge.notification.email.EmailService;
import com.bidforge.notification.notification.dto.CreateNotificationRequest;
import com.bidforge.notification.preferences.NotificationPreferenceService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final NotificationPreferenceService preferenceService;
    private final EmailService emailService;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(CreateNotificationRequest req) {
        if (!preferenceService.isEnabled(req.userId(), req.type())) return;

        Notification notification = Notification.builder()
                .userId(req.userId())
                .userEmail(req.userEmail())
                .title(req.title())
                .message(req.message())
                .type(req.type())
                .referenceId(req.referenceId())
                .read(false)
                .build();

        notificationRepository.save(notification);

        long count = notificationRepository.countByUserIdAndReadFalse(req.userId());

        // Push via WebSocket to the user's email destination
        messagingTemplate.convertAndSendToUser(req.userEmail(), "/queue/notifications", notification);
        messagingTemplate.convertAndSendToUser(req.userEmail(), "/queue/notification-count", count);

        // Send email (async, fire-and-forget)
        emailService.sendNotificationEmail(req.userEmail(), req.title(), req.message());
    }

    public List<Notification> getUserNotifications(Long userId) {
        return notificationRepository.findByUserIdOrderByCreatedAtDesc(userId);
    }

    public long getUnreadCount(Long userId) {
        return notificationRepository.countByUserIdAndReadFalse(userId);
    }

    public void markAsRead(UUID id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));
        if (!notification.getUserId().equals(userId)) throw new RuntimeException("Not allowed");
        notification.setRead(true);
        notificationRepository.save(notification);

        long count = notificationRepository.countByUserIdAndReadFalse(userId);
        messagingTemplate.convertAndSendToUser(notification.getUserEmail(), "/queue/notification-count", count);
    }

    @Transactional
    public void markAllAsRead(Long userId, String userEmail) {
        notificationRepository.markAllReadByUserId(userId);
        messagingTemplate.convertAndSendToUser(userEmail, "/queue/notification-count", 0L);
    }
}
