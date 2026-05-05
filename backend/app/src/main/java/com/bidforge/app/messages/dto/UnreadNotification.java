package com.bidforge.app.messages.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class UnreadNotification {
    private UUID roomId;
    private long unreadCount;
}

