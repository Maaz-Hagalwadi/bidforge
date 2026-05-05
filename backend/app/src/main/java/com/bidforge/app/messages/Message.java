package com.bidforge.app.messages;

import com.bidforge.app.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
public class Message {

    @Id
    @GeneratedValue
    private UUID id;

    @ManyToOne
    private ChatRoom chatRoom;

    @ManyToOne
    private User sender;

    private String content;

    private String fileUrl;
    private String fileName;
    private String fileType; // "image" or "file"

    @Column(nullable = false)
    private boolean isRead = false;

    @CreationTimestamp
    private LocalDateTime sentAt;
}