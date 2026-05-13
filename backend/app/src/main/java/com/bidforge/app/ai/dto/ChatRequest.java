package com.bidforge.app.ai.dto;

import lombok.Data;
import java.util.List;

@Data
public class ChatRequest {
    private String message;
    private List<ChatMessage> history;

    @Data
    public static class ChatMessage {
        private String role;   // "user" or "model"
        private String content;
    }
}
