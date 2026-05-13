package com.bidforge.app.ai.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

@Data
@AllArgsConstructor
public class JobRecommendation {
    private String jobId;
    private String title;
    private Integer matchScore;
    private String matchReason;
    private Double budgetMin;
    private Double budgetMax;
    private String category;
    private String requiredSkills;
}
