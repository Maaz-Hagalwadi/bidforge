package com.bidforge.app.messages;

import com.bidforge.app.contract.Contract;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.messages.dto.ChatMessageResponse;
import com.bidforge.app.messages.dto.ChatRoomResponse;
import com.bidforge.app.messages.dto.ReadReceiptEvent;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/contracts")
@RequiredArgsConstructor
public class ChatRestController {

    private final ChatService chatService;
    private final ContractRepository contractRepository;
    private final UserRepository userRepository;
    private final SimpMessagingTemplate messagingTemplate;

    private User getCurrentUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @GetMapping("/{contractId}/chat")
    public ChatRoomResponse getOrCreateChat(@PathVariable UUID contractId) {

        User user = getCurrentUser();

        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new RuntimeException("Contract not found"));

        ChatRoom room = chatService.getOrCreateRoom(contract);

        chatService.validateUserInRoom(room, user);

        return ChatRoomResponse.from(room);
    }

    @GetMapping("/chat/{roomId}/messages")
    public List<ChatMessageResponse> getMessages(@PathVariable UUID roomId) {

        User user = getCurrentUser();

        ChatRoom room = chatService.getRoomById(roomId);

        chatService.validateUserInRoom(room, user);

        return chatService.getMessages(room);
    }

    @GetMapping("/chat/my-rooms")
    public List<ChatRoomResponse> getMyChats() {

        User user = getCurrentUser();

        return chatService.getUserChatRooms(user)
                .stream()
                .map(ChatRoomResponse::from)
                .toList();
    }

    @PostMapping("/chat/{roomId}/mark-read")
    public void markMessagesAsRead(@PathVariable UUID roomId) {
        User user = getCurrentUser();
        ChatRoom room = chatService.getRoomById(roomId);
        chatService.validateUserInRoom(room, user);
        chatService.markMessagesAsRead(roomId, user);
        messagingTemplate.convertAndSend(
                "/topic/read/" + roomId,
                new ReadReceiptEvent(roomId, user.getId())
        );
    }

    @GetMapping("/chat/{roomId}/unread-count")
    public long getUnreadCount(@PathVariable UUID roomId) {
        User user = getCurrentUser();
        ChatRoom room = chatService.getRoomById(roomId);
        chatService.validateUserInRoom(room, user);
        return chatService.countUnreadMessages(roomId, user);
    }

    @PostMapping("/user/online")
    public void setOnlineStatus() {
        User user = getCurrentUser();
        userRepository.updateOnlineStatus(user.getId(), true, LocalDateTime.now());
    }

    @PostMapping("/user/offline")
    public void setOfflineStatus() {
        User user = getCurrentUser();
        userRepository.updateOnlineStatus(user.getId(), false, LocalDateTime.now());
    }
}