package com.bidforge.contract.chat;

import com.bidforge.contract.auth.UserInfo;
import com.bidforge.contract.chat.dto.ChatMessageResponse;
import com.bidforge.contract.chat.dto.ChatRoomResponse;
import com.bidforge.contract.common.exception.AccessDeniedException;
import com.bidforge.contract.common.exception.ContractNotFoundException;
import com.bidforge.contract.contract.Contract;
import com.bidforge.contract.contract.ContractRepository;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@RequiredArgsConstructor
public class ChatService {

    private final ChatRoomRepository chatRoomRepository;
    private final MessageRepository messageRepository;
    private final ContractRepository contractRepository;

    @Transactional
    public ChatRoomResponse getOrCreateRoom(UUID contractId, UserInfo user) {
        Contract contract = contractRepository.findById(contractId)
                .orElseThrow(() -> new ContractNotFoundException("Contract not found"));

        boolean isClient = contract.getClientId().equals(user.id());
        boolean isFreelancer = contract.getFreelancerId().equals(user.id());

        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("You are not a party to this contract");
        }

        ChatRoom room = chatRoomRepository.findByContractId(contractId)
                .orElseGet(() -> {
                    ChatRoom newRoom = ChatRoom.builder()
                            .contractId(contractId)
                            .clientId(contract.getClientId())
                            .freelancerId(contract.getFreelancerId())
                            .build();
                    return chatRoomRepository.save(newRoom);
                });

        long unreadCount = messageRepository.countByRoomAndIsReadFalseAndSenderIdNot(room, user.id());
        String lastMessage = messageRepository.findByRoomOrderByCreatedAtDesc(room, PageRequest.of(0, 1))
                .stream().findFirst().map(Message::getContent).orElse(null);

        return mapRoomToResponse(room, unreadCount, lastMessage);
    }

    public Page<ChatMessageResponse> getMessages(UUID roomId, UserInfo user, int page, int size) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        validateRoomAccess(room, user);

        return messageRepository.findByRoomOrderByCreatedAtDesc(room, PageRequest.of(page, size))
                .map(this::mapMessageToResponse);
    }

    public List<ChatRoomResponse> getMyRooms(UserInfo user) {
        return chatRoomRepository.findByClientIdOrFreelancerId(user.id(), user.id())
                .stream().map(room -> {
                    long unreadCount = messageRepository.countByRoomAndIsReadFalseAndSenderIdNot(room, user.id());
                    String lastMessage = messageRepository.findByRoomOrderByCreatedAtDesc(room, PageRequest.of(0, 1))
                            .stream().findFirst().map(Message::getContent).orElse(null);
                    return mapRoomToResponse(room, unreadCount, lastMessage);
                }).toList();
    }

    @Transactional
    public void markRead(UUID roomId, UserInfo user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        validateRoomAccess(room, user);

        List<Message> unread = messageRepository.findByRoomAndIsReadFalseAndSenderIdNot(room, user.id());
        unread.forEach(m -> m.setRead(true));
        messageRepository.saveAll(unread);
    }

    public long getUnreadCount(UUID roomId, UserInfo user) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        validateRoomAccess(room, user);

        return messageRepository.countByRoomAndIsReadFalseAndSenderIdNot(room, user.id());
    }

    @Transactional
    public ChatMessageResponse saveMessage(UUID roomId, Long senderId, String senderName,
                                           String content, String fileUrl) {
        ChatRoom room = chatRoomRepository.findById(roomId)
                .orElseThrow(() -> new RuntimeException("Chat room not found"));

        Message message = Message.builder()
                .room(room)
                .senderId(senderId)
                .senderName(senderName)
                .content(content)
                .fileUrl(fileUrl)
                .isRead(false)
                .build();

        Message saved = messageRepository.save(message);
        log.debug("Message saved: messageId={} roomId={} senderId={}", saved.getId(), roomId, senderId);
        return mapMessageToResponse(saved);
    }

    private void validateRoomAccess(ChatRoom room, UserInfo user) {
        boolean isClient = room.getClientId().equals(user.id());
        boolean isFreelancer = room.getFreelancerId().equals(user.id());
        if (!isClient && !isFreelancer) {
            throw new AccessDeniedException("You do not have access to this chat room");
        }
    }

    private ChatRoomResponse mapRoomToResponse(ChatRoom room, long unreadCount, String lastMessage) {
        return ChatRoomResponse.builder()
                .id(room.getId())
                .contractId(room.getContractId())
                .clientId(room.getClientId())
                .freelancerId(room.getFreelancerId())
                .lastMessage(lastMessage)
                .unreadCount(unreadCount)
                .createdAt(room.getCreatedAt())
                .build();
    }

    private ChatMessageResponse mapMessageToResponse(Message m) {
        return ChatMessageResponse.builder()
                .id(m.getId())
                .roomId(m.getRoom().getId())
                .senderId(m.getSenderId())
                .senderName(m.getSenderName())
                .content(m.getContent())
                .fileUrl(m.getFileUrl())
                .isRead(m.isRead())
                .createdAt(m.getCreatedAt())
                .build();
    }
}
