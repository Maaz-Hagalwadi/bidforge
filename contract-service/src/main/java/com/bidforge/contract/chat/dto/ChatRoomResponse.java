package com.bidforge.contract.chat.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ChatRoomResponse {
    private UUID id;
    private UUID contractId;
    private Long clientId;
    private Long freelancerId;
    private String lastMessage;
    private long unreadCount;
    private LocalDateTime createdAt;
}
