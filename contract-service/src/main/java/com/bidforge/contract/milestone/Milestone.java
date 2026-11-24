package com.bidforge.contract.milestone;

import com.bidforge.contract.contract.Contract;
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
@NoArgsConstructor
@AllArgsConstructor
public class Milestone {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    // Milestone and Contract are in the same service, so @ManyToOne is fine
    @ManyToOne(fetch = FetchType.LAZY)
    private Contract contract;

    private String title;
    private String description;
    private Double amount;
    private LocalDateTime dueDate;

    @Enumerated(EnumType.STRING)
    private MilestoneStatus status;

    private boolean funded;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
