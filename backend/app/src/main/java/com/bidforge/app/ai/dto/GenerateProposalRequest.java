package com.bidforge.app.ai.dto;

import lombok.Data;

@Data
public class GenerateProposalRequest {
    private String jobTitle;
    private String jobDescription;
    private String requiredSkills;
}
