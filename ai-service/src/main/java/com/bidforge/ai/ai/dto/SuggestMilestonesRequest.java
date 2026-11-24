package com.bidforge.ai.ai.dto;

import lombok.Data;

@Data
public class SuggestMilestonesRequest {
    private String jobTitle;
    private String jobDescription;
    private Double budget;
}
