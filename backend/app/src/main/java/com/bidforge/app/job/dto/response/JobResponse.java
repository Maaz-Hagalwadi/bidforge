package com.bidforge.app.job.dto.response;

import com.bidforge.app.job.enums.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class JobResponse {

    private UUID id;
    private String title;
    private String category;
    private String description;
    private String requiredSkills;
    private BudgetType budgetType;
    private Double budgetMin;
    private Double budgetMax;
    private LocalDateTime deadline;
    private String attachmentUrl;
    private Visibility visibility;
    private JobStatus status;
    private Long clientId;
    private String clientName;
    private ExperienceLevel experienceLevel;
    private UrgencyLevel urgencyLevel;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Integer bidsCount;
    private String assignedFreelancerName;
}
