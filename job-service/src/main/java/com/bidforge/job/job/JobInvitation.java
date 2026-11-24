package com.bidforge.job.job;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(
    name = "job_invitation",
    uniqueConstraints = @UniqueConstraint(columnNames = {"job_id", "freelancer_id"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobInvitation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    // No @ManyToOne User — store the freelancer's ID directly
    @Column(name = "freelancer_id", nullable = false)
    private Long freelancerId;

    @CreationTimestamp
    @Column(updatable = false)
    private LocalDateTime invitedAt;
}
