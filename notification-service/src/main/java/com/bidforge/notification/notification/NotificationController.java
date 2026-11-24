package com.bidforge.notification.notification;

import com.bidforge.notification.auth.UserInfo;
import com.bidforge.notification.notification.dto.CreateNotificationRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private UserInfo currentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/notifications")
    public List<Notification> getMyNotifications() {
        return notificationService.getUserNotifications(currentUser().id());
    }

    @GetMapping("/notifications/unread-count")
    public long getUnreadCount() {
        return notificationService.getUnreadCount(currentUser().id());
    }

    @PatchMapping("/notifications/{id}/read")
    public ResponseEntity<Void> markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id, currentUser().id());
        return ResponseEntity.ok().build();
    }

    @PatchMapping("/notifications/read-all")
    public ResponseEntity<Void> markAllAsRead() {
        UserInfo user = currentUser();
        notificationService.markAllAsRead(user.id(), user.email());
        return ResponseEntity.ok().build();
    }

    // Called by other services (job-service, bid-service, etc.) — not by the frontend directly
    @PostMapping("/internal/notifications")
    public ResponseEntity<Void> createInternal(@RequestBody CreateNotificationRequest req) {
        notificationService.createNotification(req);
        return ResponseEntity.ok().build();
    }
}
