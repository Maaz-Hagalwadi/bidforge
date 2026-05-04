package com.bidforge.app.notification;

import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
    }

    @GetMapping
    public List<Notification> getMyNotifications() {
        return notificationService.getUserNotifications(getCurrentUser());
    }

    @GetMapping("/unread-count")
    public long getUnreadCount() {
        return notificationService.getUnreadCount(getCurrentUser());
    }

    @PatchMapping("/{id}/read")
    public void markAsRead(@PathVariable UUID id) {
        notificationService.markAsRead(id, getCurrentUser());
    }

    @PatchMapping("/read-all")
    public void markAllAsRead() {
        notificationService.markAllAsRead(getCurrentUser());
    }
}
