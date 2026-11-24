package com.bidforge.notification.notification.dto;

import com.bidforge.notification.notification.NotificationType;

import java.util.UUID;

public record CreateNotificationRequest(
        Long userId,
        String userEmail,
        String title,
        String message,
        NotificationType type,
        UUID referenceId
) {}
