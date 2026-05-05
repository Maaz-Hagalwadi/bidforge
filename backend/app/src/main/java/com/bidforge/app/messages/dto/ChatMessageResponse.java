package com.bidforge.app.messages.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatMessageResponse {
    private UUID id;
    private UUID roomId;
    private Long senderId;
    private String senderName;
    private String content;
    private String fileUrl;
    private String fileName;
    private String fileType;
    @JsonProperty("isRead")
    private boolean isRead;
    private LocalDateTime sentAt;
}