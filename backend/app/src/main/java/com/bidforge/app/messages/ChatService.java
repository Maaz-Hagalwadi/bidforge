package com.bidforge.app.messages;

import com.bidforge.app.common.exception.AccessDeniedException;
import com.bidforge.app.contract.Contract;
import com.bidforge.app.messages.dto.ChatMessageRequest;
import com.bidforge.app.messages.dto.ChatMessageResponse;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.security.Principal;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepo;
    private final MessageRepository messageRepo;
    private final UserRepository userRepository;

    // 🔹 Get room
    public ChatRoom getRoomById(UUID roomId) {
        return chatRoomRepo.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));
    }

    public long getUnreadCount(UUID roomId, Long userId) {
        return messageRepo.countUnreadMessages(roomId, userId);
    }

    @Transactional
    public void markAsRead(UUID roomId, Long userId) {
        messageRepo.markMessagesAsRead(roomId, userId);
    }

    // 🔹 Save message
    public Message saveMessage(ChatRoom room, User sender, ChatMessageRequest request) {
        Message msg = new Message();
        msg.setChatRoom(room);
        msg.setSender(sender);
        msg.setContent(request.getContent());
        msg.setFileUrl(request.getFileUrl());
        msg.setFileName(request.getFileName());
        msg.setFileType(request.getFileType());
        return messageRepo.save(msg);
    }

    // 🔹 Map response DTO
    public ChatMessageResponse mapToResponse(Message msg) {
        return ChatMessageResponse.builder()
                .id(msg.getId())
                .roomId(msg.getChatRoom().getId())
                .senderId(msg.getSender().getId())
                .senderName(msg.getSender().getName())
                .content(msg.getContent())
                .fileUrl(msg.getFileUrl())
                .fileName(msg.getFileName())
                .fileType(msg.getFileType())
                .isRead(msg.isRead())
                .sentAt(msg.getSentAt())
                .build();
    }

    // 🔹 Get current user from JWT
    public User getCurrentUser(Principal principal) {
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("User not found"));
    }

    public List<ChatMessageResponse> getMessages(ChatRoom room) {
        return messageRepo.findByChatRoomOrderBySentAtAsc(room)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    // 🔒 Security check
    public void validateUserInRoom(ChatRoom room, User user) {
        if (!room.getClient().getId().equals(user.getId()) &&
                !room.getFreelancer().getId().equals(user.getId())) {
            throw new AccessDeniedException("Not allowed in this chat");
        }
    }

    public List<ChatRoom> getUserChatRooms(User user) {
        return chatRoomRepo.findByClientOrFreelancer(user, user);
    }

    // 🔹 Create chat room for contract
    public ChatRoom createChatRoom(Contract contract) {
        // Check if room already exists
        return chatRoomRepo.findByContract(contract)
                .orElseGet(() -> {
                    ChatRoom room = new ChatRoom();
                    room.setContract(contract);
                    room.setClient(contract.getClient());
                    room.setFreelancer(contract.getFreelancer());
                    return chatRoomRepo.save(room);
                });
    }

    // Alias for ChatRestController compatibility
    public ChatRoom getOrCreateRoom(Contract contract) {
        return createChatRoom(contract);
    }

    // 🔹 Mark messages as read
    public void markMessagesAsRead(UUID roomId, User user) {
        messageRepo.markMessagesAsRead(roomId, user.getId());
    }

    // 🔹 Count unread messages
    public long countUnreadMessages(UUID roomId, User user) {
        return messageRepo.countUnreadMessages(roomId, user.getId());
    }
}