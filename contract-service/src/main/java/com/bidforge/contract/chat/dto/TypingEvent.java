package com.bidforge.contract.chat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class TypingEvent {
    private UUID roomId;
    private Long senderId;
    private boolean typing;
}
