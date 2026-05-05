package com.bidforge.app.messages.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.UUID;

@Data
@AllArgsConstructor
public class ReadReceiptEvent {
    private UUID roomId;
    private Long readByUserId;
}
