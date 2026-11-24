package com.bidforge.job.kafka;

public record NotificationEvent(
        Long userId,
        String userEmail,
        String title,
        String message,
        String type,        // e.g. "BID_PLACED" — String so it serializes cleanly across services
        String referenceId  // UUID as String, empty string if null
) {}
