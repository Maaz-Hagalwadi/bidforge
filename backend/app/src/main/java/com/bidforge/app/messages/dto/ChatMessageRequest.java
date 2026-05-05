package com.bidforge.app.messages.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class ChatMessageRequest {
    private UUID roomId;
    private String content;
    private String fileUrl;
    private String fileName;
    private String fileType;
}