package com.bidforge.contract.chat.dto;

import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
public class ReadReceiptEvent {
    private UUID roomId;
    private Long readerId;
}
