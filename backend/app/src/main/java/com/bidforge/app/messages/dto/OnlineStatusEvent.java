package com.bidforge.app.messages.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@AllArgsConstructor
public class OnlineStatusEvent {
    private Long userId;
    private String username;
    private boolean online;
    private LocalDateTime lastSeen;
}
