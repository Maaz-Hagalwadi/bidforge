package com.bidforge.job.job.dto.request;

import com.bidforge.job.job.enums.BudgetType;
import com.bidforge.job.job.enums.ExperienceLevel;
import com.bidforge.job.job.enums.UrgencyLevel;
import com.bidforge.job.job.enums.Visibility;
import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String category;

    @NotBlank
    @Size(max = 2000)
    private String description;

    private String requiredSkills;

    @NotNull
    private BudgetType budgetType;

    @NotNull
    private Double budgetMin;

    @NotNull
    private Double budgetMax;

    @FutureOrPresent(message = "Deadline must be today or in the future")
    private LocalDateTime deadline;

    private String attachmentUrl;

    @NotNull
    private Visibility visibility;

    @NotNull(message = "Experience level is required")
    private ExperienceLevel experienceLevel;

    @NotNull(message = "Urgency level is required")
    private UrgencyLevel urgencyLevel;

    private boolean draft;
}
