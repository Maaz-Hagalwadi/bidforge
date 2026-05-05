package com.bidforge.app.messages;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

public interface MessageRepository extends JpaRepository<Message, UUID> {
    List<Message> findByChatRoomOrderBySentAtAsc(ChatRoom chatRoom);

    // 🔹 count unread
    @Query("""
        SELECT COUNT(m) FROM Message m
        WHERE m.chatRoom.id = :roomId
        AND m.sender.id <> :userId
        AND m.isRead = false
    """)
    long countUnreadMessages(@Param("roomId") UUID roomId,
                             @Param("userId") Long userId);

    // 🔹 mark as read
    @Modifying
    @Transactional
    @Query("""
        UPDATE Message m
        SET m.isRead = true
        WHERE m.chatRoom.id = :roomId
        AND m.sender.id <> :userId
        AND m.isRead = false
    """)
    void markMessagesAsRead(@Param("roomId") UUID roomId,
                            @Param("userId") Long userId);
}
