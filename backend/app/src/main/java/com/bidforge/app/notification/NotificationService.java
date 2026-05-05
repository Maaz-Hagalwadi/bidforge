package com.bidforge.app.notification;

import com.bidforge.app.user.User;
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

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void createNotification(
            User user,
            String title,
            String message,
            NotificationType type,
            UUID referenceId
    ) {
        Notification notification = Notification.builder()
                .user(user)
                .title(title)
                .message(message)
                .type(type)
                .referenceId(referenceId)
                .read(false)
                .build();

        notificationRepository.save(notification);

        long count = notificationRepository.countByUserAndReadFalse(user);

        messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/notifications",
                notification
        );

        messagingTemplate.convertAndSendToUser(
                user.getEmail(),
                "/queue/notification-count",
                count
        );
    }

    public List<Notification> getUserNotifications(User user) {
        return notificationRepository.findByUserOrderByCreatedAtDesc(user);
    }

    public long getUnreadCount(User user) {
        return notificationRepository.countByUserAndReadFalse(user);
    }

    public void markAsRead(UUID id, User user) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Notification not found"));

        if (!notification.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not allowed");
        }

        notification.setRead(true);
        notificationRepository.save(notification);

        long count = notificationRepository.countByUserAndReadFalse(user);
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notification-count", count);
    }

    @Transactional
    public void markAllAsRead(User user) {
        notificationRepository.markAllReadByUser(user);
        messagingTemplate.convertAndSendToUser(user.getEmail(), "/queue/notification-count", 0L);
    }
}