package com.bidforge.contract.chat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ChatMessageRequest {
    private UUID roomId;
    private String content;
    private String fileUrl;
}
