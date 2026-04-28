package com.bidforge.app.job.dto.response;

import com.bidforge.app.job.enums.BudgetType;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
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
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
