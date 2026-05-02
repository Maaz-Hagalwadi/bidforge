package com.bidforge.app.milestone.dto;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
public class CreateMilestoneRequest {
    private String title;
    private String description;
    private Double amount;
    private LocalDateTime dueDate;
}
