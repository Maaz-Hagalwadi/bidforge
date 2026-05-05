package com.bidforge.app.messages;

import com.bidforge.app.messages.dto.ChatMessageRequest;
import com.bidforge.app.messages.dto.ChatMessageResponse;
import com.bidforge.app.messages.dto.TypingEvent;
import com.bidforge.app.messages.dto.UnreadNotification;
import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;

import java.security.Principal;
import java.util.UUID;

@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser(Principal principal) {
        if (principal instanceof UsernamePasswordAuthenticationToken) {
            return (User) ((UsernamePasswordAuthenticationToken) principal).getPrincipal();
        }
        throw new RuntimeException("Invalid authentication type");
    }

    // WebSocket endpoint only
    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest request, Principal principal) {

        User sender = getCurrentUser(principal);
        ChatRoom room = chatService.getRoomById(request.getRoomId());
        chatService.validateUserInRoom(room, sender);

        Message message = chatService.saveMessage(room, sender, request);
        ChatMessageResponse response = chatService.mapToResponse(message);

        messagingTemplate.convertAndSend("/topic/chat/" + room.getId(), response);

// 🔔 send notification to other user
        Long receiverId = room.getClient().getId().equals(sender.getId())
                ? room.getFreelancer().getId()
                : room.getClient().getId();

        long unread = chatService.getUnreadCount(room.getId(), receiverId);

        messagingTemplate.convertAndSend(
                "/topic/notifications/" + receiverId,
                new UnreadNotification(room.getId(), unread)
        );
    }

    @MessageMapping("/chat.typing")
    public void typing(TypingEvent event, Principal principal) {

        User user = getCurrentUser(principal);

        ChatRoom room = chatService.getRoomById(event.getRoomId());
        chatService.validateUserInRoom(room, user);

        Long receiverId = room.getClient().getId().equals(user.getId())
                ? room.getFreelancer().getId()
                : room.getClient().getId();

        TypingEvent response = new TypingEvent(
                room.getId(),
                user.getId(),
                user.getName(),
                event.isTyping()
        );

        messagingTemplate.convertAndSend(
                "/topic/typing/" + room.getId(),
                response
        );
    }

    @GetMapping("/chat/{roomId}/unread-count")
    public long getUnread(
            @PathVariable UUID roomId,
            Principal principal
    ) {
        User user = chatService.getCurrentUser(principal);
        return chatService.getUnreadCount(roomId, user.getId());
    }

    @PostMapping("/chat/{roomId}/read")
    public void markRead(
            @PathVariable UUID roomId,
            Principal principal
    ) {
        User user = chatService.getCurrentUser(principal);
        chatService.markAsRead(roomId, user.getId());
    }
}