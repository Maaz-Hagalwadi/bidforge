package com.bidforge.contract.kafka;

public record NotificationEvent(
        Long userId,
        String userEmail,
        String title,
        String message,
        String type,        // e.g. "CONTRACT_CREATED" — String so it serializes cleanly across services
        String referenceId  // UUID as String, empty string if null
) {}
