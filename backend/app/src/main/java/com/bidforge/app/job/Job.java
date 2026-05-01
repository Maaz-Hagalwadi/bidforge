package com.bidforge.app.job;

import com.bidforge.app.job.enums.*;
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
public class Job {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    private String title;
    private String category;

    @Column(length = 2000)
    private String description;

    private String requiredSkills;

    @Enumerated(EnumType.STRING)
    private BudgetType budgetType;

    private LocalDateTime deadline;

    private Double budgetMin;
    private Double budgetMax;

    @Enumerated(EnumType.STRING)
    private ExperienceLevel experienceLevel;

    @Enumerated(EnumType.STRING)
    private UrgencyLevel urgencyLevel;

    @Enumerated(EnumType.STRING)
    private JobStatus status;

    private String attachmentUrl;

    @Enumerated(EnumType.STRING)
    private Visibility visibility;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "client_id")
    private User client;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;

}