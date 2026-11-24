package com.bidforge.notification.kafka;

public record NotificationEvent(
        Long userId,
        String userEmail,
        String title,
        String message,
        String type,
        String referenceId
) {}
