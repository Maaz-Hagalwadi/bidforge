package com.bidforge.app.messages;

import com.bidforge.app.contract.Contract;
import com.bidforge.app.user.User;
import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Entity
public class ChatRoom {

    @Id
    @GeneratedValue
    private UUID id;

    @OneToOne
    private Contract contract;

    @ManyToOne
    private User client;

    @ManyToOne
    private User freelancer;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
