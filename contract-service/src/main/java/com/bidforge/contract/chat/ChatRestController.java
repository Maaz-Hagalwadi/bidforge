package com.bidforge.contract.chat;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.chat.dto.ChatMessageResponse;
import com.bidforge.contract.chat.dto.ChatRoomResponse;
import com.bidforge.contract.chat.dto.ReadReceiptEvent;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/chat")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/contracts/{contractId}")
    public ChatRoomResponse getOrCreateRoom(@PathVariable UUID contractId) {
        return chatService.getOrCreateRoom(contractId, getCurrentUser());
    }

    @GetMapping("/rooms/{roomId}/messages")
    public Page<ChatMessageResponse> getMessages(
            @PathVariable UUID roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return chatService.getMessages(roomId, getCurrentUser(), page, size);
    }

    @GetMapping("/rooms/my")
    public List<ChatRoomResponse> getMyRooms() {
        return chatService.getMyRooms(getCurrentUser());
    }

    @PostMapping("/rooms/{roomId}/mark-read")
    public void markRead(@PathVariable UUID roomId) {
        UserInfo user = getCurrentUser();
        chatService.markRead(roomId, user);

        ReadReceiptEvent event = new ReadReceiptEvent();
        event.setRoomId(roomId);
        event.setReaderId(user.id());
        messagingTemplate.convertAndSend("/topic/read/" + roomId, event);
    }

    @GetMapping("/rooms/{roomId}/unread-count")
    public Map<String, Long> getUnreadCount(@PathVariable UUID roomId) {
        long count = chatService.getUnreadCount(roomId, getCurrentUser());
        return Map.of("unreadCount", count);
    }
}
