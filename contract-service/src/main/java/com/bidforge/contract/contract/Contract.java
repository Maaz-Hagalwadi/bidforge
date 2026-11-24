package com.bidforge.contract.contract;

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

    // No @OneToOne Job — store what we need as plain columns
    private UUID jobId;
    private String jobTitle;
    private String jobDeadline;

    // No @ManyToOne User — store client/freelancer details directly
    private Long clientId;
    private String clientEmail;
    private String clientName;

    private Long freelancerId;
    private String freelancerEmail;
    private String freelancerName;

    private Double agreedAmount;
    private Integer deliveryDays;

    @Enumerated(EnumType.STRING)
    private ContractStatus status;

    private String submissionNote;
    private String submissionUrl;
    private LocalDateTime submittedAt;

    private String revisionNote;
    private LocalDateTime revisionRequestedAt;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
