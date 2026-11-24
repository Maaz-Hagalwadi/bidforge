package com.bidforge.contract.chat.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ChatMessageResponse {
    private UUID id;
    private UUID roomId;
    private Long senderId;
    private String senderName;
    private String content;
    private String fileUrl;
    private boolean isRead;
    private LocalDateTime createdAt;
}
