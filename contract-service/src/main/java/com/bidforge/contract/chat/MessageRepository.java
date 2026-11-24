package com.bidforge.contract.chat;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {

    Page<Message> findByRoomOrderByCreatedAtDesc(ChatRoom room, Pageable pageable);

    List<Message> findByRoomAndIsReadFalseAndSenderIdNot(ChatRoom room, Long senderId);

    long countByRoomAndIsReadFalseAndSenderIdNot(ChatRoom room, Long senderId);
}
