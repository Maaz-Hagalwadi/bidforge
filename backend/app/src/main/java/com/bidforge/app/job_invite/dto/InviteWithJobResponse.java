package com.bidforge.app.job_invite.dto;

import com.bidforge.app.job.enums.BudgetType;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.job.enums.Visibility;
import com.bidforge.app.job_invite.InviteStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class InviteWithJobResponse {

    private UUID inviteId;
    private InviteStatus inviteStatus;

    // Job fields
    private UUID jobId;
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
