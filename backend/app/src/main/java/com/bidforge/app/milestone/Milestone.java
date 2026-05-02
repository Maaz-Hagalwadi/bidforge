package com.bidforge.app.milestone;

import com.bidforge.app.contract.Contract;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@Table
@NoArgsConstructor
@AllArgsConstructor
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne
    private Contract contract;

    private String title;
    private String description;

    private Double amount;

    private LocalDateTime dueDate;

    @Enumerated(EnumType.STRING)
    private MilestoneStatus status;

    private boolean funded; // 💰 escrow funded or not

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
