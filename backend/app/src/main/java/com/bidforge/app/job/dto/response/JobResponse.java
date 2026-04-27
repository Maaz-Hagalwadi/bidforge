package com.bidforge.app.job.dto.response;

import com.bidforge.app.job.JobStatus;
import lombok.*;

@Getter
@Setter
@Builder
public class JobResponse {

    private Long id;
    private String title;
    private String description;
    private Double budgetMin;
    private Double budgetMax;
    private JobStatus status;
}