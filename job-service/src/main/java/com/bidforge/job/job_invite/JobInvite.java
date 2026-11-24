package com.bidforge.job.job_invite;

import com.bidforge.job.job.Job;
import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class JobInvite {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "job_id", nullable = false)
    private Job job;

    // No @ManyToOne User — store freelancer details as plain columns
    @Column(name = "freelancer_id", nullable = false)
    private Long freelancerId;

    private String freelancerEmail;
    private String freelancerName;

    @Enumerated(EnumType.STRING)
    private InviteStatus status;

    @CreationTimestamp
    private LocalDateTime invitedAt;
}
