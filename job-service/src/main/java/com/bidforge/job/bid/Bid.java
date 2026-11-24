package com.bidforge.job.bid;

import com.bidforge.job.job.Job;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;
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
public class Bid {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @NotNull
    @Positive
    private Double amount;

    @NotBlank
    @Size(max = 1000)
    private String proposal;

    private Integer deliveryDays;

    @ManyToOne(fetch = FetchType.LAZY)
    private Job job;

    // No @ManyToOne User — store freelancer details as plain columns
    private Long freelancerId;
    private String freelancerEmail;
    private String freelancerName;

    @Enumerated(EnumType.STRING)
    private BidStatus status;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
}
