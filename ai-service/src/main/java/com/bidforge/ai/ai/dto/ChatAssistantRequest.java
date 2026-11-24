package com.bidforge.ai.ai.dto;

import lombok.Data;

@Data
public class ChatAssistantRequest {
    private String userMessage;
    private String conversationContext;
}
