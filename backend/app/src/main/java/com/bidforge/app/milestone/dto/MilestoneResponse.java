package com.bidforge.app.milestone.dto;

import com.bidforge.app.milestone.MilestoneStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class MilestoneResponse {

    private UUID id;
    private String title;
    private String description;
    private Double amount;
    private LocalDateTime dueDate;

    private MilestoneStatus status;
    private boolean funded;

    private UUID contractId;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}