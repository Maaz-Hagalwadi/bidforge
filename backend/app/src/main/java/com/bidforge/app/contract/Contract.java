package com.bidforge.app.contract;

import com.bidforge.app.job.Job;
import com.bidforge.app.user.User;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Contract {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @OneToOne
    private Job job;

    @ManyToOne
    private User client;

    @ManyToOne
    private User freelancer;

    private Double agreedAmount;

    private Integer deliveryDays;

    @Enumerated(EnumType.STRING)
    private ContractStatus status;

    private String submissionNote;

    private String submissionUrl;

    private String revisionNote;
    private LocalDateTime revisionRequestedAt;

    private LocalDateTime submittedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}