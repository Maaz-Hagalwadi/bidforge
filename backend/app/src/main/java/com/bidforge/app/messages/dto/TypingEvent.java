package com.bidforge.app.messages.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class TypingEvent {
    private UUID roomId;
    private Long userId;
    private String userName;
    private boolean typing; // true = typing, false = stopped
}
