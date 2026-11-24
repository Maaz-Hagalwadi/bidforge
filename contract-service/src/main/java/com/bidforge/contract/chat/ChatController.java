package com.bidforge.contract.chat;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.chat.dto.ChatMessageRequest;
import com.bidforge.contract.chat.dto.ChatMessageResponse;
import com.bidforge.contract.chat.dto.TypingEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

import java.security.Principal;

@Slf4j
@Controller
@RequiredArgsConstructor
public class ChatController {

    private final ChatService chatService;
    private final SimpMessagingTemplate messagingTemplate;
    private final ChatRoomRepository chatRoomRepository;

    @MessageMapping("/chat.send")
    public void sendMessage(ChatMessageRequest req, Principal principal) {
        if (principal == null) {
            log.warn("Unauthenticated WebSocket send attempt");
            return;
        }

        UserInfo user = (UserInfo) ((org.springframework.security.authentication.UsernamePasswordAuthenticationToken) principal).getPrincipal();

        ChatMessageResponse response = chatService.saveMessage(
                req.getRoomId(),
                user.id(),
                user.name(),
                req.getContent(),
                req.getFileUrl()
        );

        // Broadcast message to all subscribers of this room
        messagingTemplate.convertAndSend("/topic/chat/" + req.getRoomId(), response);

        // Push unread notification to the other party in the room
        chatRoomRepository.findById(req.getRoomId()).ifPresent(room -> {
            Long receiverId = room.getClientId().equals(user.id())
                    ? room.getFreelancerId()
                    : room.getClientId();
            messagingTemplate.convertAndSend("/topic/notifications/" + receiverId, response);
        });
    }

    @MessageMapping("/chat.typing")
    public void typing(TypingEvent event, Principal principal) {
        if (principal == null) return;
        messagingTemplate.convertAndSend("/topic/typing/" + event.getRoomId(), event);
    }
}
