package com.bidforge.app.messages.dto;

import com.bidforge.app.messages.ChatRoom;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ChatRoomResponse {
    private UUID roomId;
    private UUID contractId;
    private Long clientId;
    private String clientName;
    private boolean clientOnline;
    private LocalDateTime clientLastSeen;
    private Long freelancerId;
    private String freelancerName;
    private boolean freelancerOnline;
    private LocalDateTime freelancerLastSeen;
    private String jobTitle;

    public static ChatRoomResponse from(ChatRoom room) {
        return ChatRoomResponse.builder()
                .roomId(room.getId())
                .contractId(room.getContract().getId())
                .clientId(room.getClient().getId())
                .clientName(room.getClient().getName())
                .clientOnline(room.getClient().isOnline())
                .clientLastSeen(room.getClient().getLastSeen())
                .freelancerId(room.getFreelancer().getId())
                .freelancerName(room.getFreelancer().getName())
                .freelancerOnline(room.getFreelancer().isOnline())
                .freelancerLastSeen(room.getFreelancer().getLastSeen())
                .jobTitle(room.getContract().getJob().getTitle())
                .build();
    }
}
