package com.bidforge.app.job.dto.request;

import com.bidforge.app.job.enums.BudgetType;
import com.bidforge.app.job.enums.Visibility;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobRequest {

    // Basic
    @NotBlank
    private String title;

    @NotBlank
    private String category;

    @NotBlank
    @Size(max = 2000)
    private String description;

    private String requiredSkills;

    // Budget
    @NotNull
    private BudgetType budgetType;

    @NotNull
    private Double budgetMin;

    @NotNull
    private Double budgetMax;

    // Timeline
    @FutureOrPresent(message = "Deadline must be today or in the future")
    private LocalDateTime deadline;

    // File
    private String attachmentUrl;

    // Visibility
    @NotNull
    private Visibility visibility;

    // Draft or publish
    private boolean draft;
}