package com.bidforge.job.job_invite.dto;

import com.bidforge.job.job.enums.BudgetType;
import com.bidforge.job.job.enums.JobStatus;
import com.bidforge.job.job.enums.Visibility;
import com.bidforge.job.job_invite.InviteStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class InviteWithJobResponse {

    private UUID inviteId;
    private InviteStatus inviteStatus;

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
