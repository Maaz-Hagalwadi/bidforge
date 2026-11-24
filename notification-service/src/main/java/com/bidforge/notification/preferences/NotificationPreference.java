package com.bidforge.notification.preferences;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;

@Entity
@Table(name = "notification_preference")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NotificationPreference {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Plain column — no FK to users table (different DB)
    @Column(unique = true, nullable = false)
    private Long userId;

    @Builder.Default private boolean jobCreated = true;
    @Builder.Default private boolean jobInvited = true;
    @Builder.Default private boolean bidPlaced = true;
    @Builder.Default private boolean bidAccepted = true;
    @Builder.Default private boolean bidRejected = true;
    @Builder.Default private boolean contractCreated = true;
    @Builder.Default private boolean contractSubmitted = true;
    @Builder.Default private boolean contractCompleted = true;
    @Builder.Default private boolean revisionRequested = true;
    @Builder.Default private boolean milestoneCreated = true;
    @Builder.Default private boolean milestoneFunded = true;
    @Builder.Default private boolean milestoneSubmitted = true;
    @Builder.Default private boolean milestoneApproved = true;
    @Builder.Default private boolean milestoneRejected = true;
    @Builder.Default private boolean milestoneRefunded = true;
    @Builder.Default private boolean paymentReleased = true;
    @Builder.Default private boolean reviewReceived = true;
    @Builder.Default private boolean disputeOpened = true;
    @Builder.Default private boolean disputeResolved = true;
    @Builder.Default private boolean userBanned = true;
    @Builder.Default private boolean newUserRegistered = true;

    @CreationTimestamp private LocalDateTime createdAt;
    @UpdateTimestamp private LocalDateTime updatedAt;
}
