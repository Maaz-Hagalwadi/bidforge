package com.bidforge.app.job.dto.request;

import com.bidforge.app.job.enums.BudgetType;
import com.bidforge.app.job.enums.ExperienceLevel;
import com.bidforge.app.job.enums.UrgencyLevel;
import com.bidforge.app.job.enums.Visibility;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
public class UpdateJobRequest {

    @NotBlank
    private String title;

    @NotBlank
    private String category;

    @NotBlank
    private String description;

    private String requiredSkills;

    @NotNull
    private BudgetType budgetType;

    @NotNull
    @Positive
    private Double budgetMin;

    @NotNull
    @Positive
    private Double budgetMax;

    private LocalDateTime deadline;
    private String attachmentUrl;
    private Visibility visibility;
    private ExperienceLevel experienceLevel;
    private UrgencyLevel urgencyLevel;
}
