package com.bidforge.app.job.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class CreateJobRequest {

    @NotBlank
    private String title;

    @NotBlank
    @Size(max = 2000)
    private String description;

    @NotNull
    private Double budgetMin;

    @NotNull
    private Double budgetMax;
}