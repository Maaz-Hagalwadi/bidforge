package com.bidforge.ai.ai.dto;

import lombok.Data;

@Data
public class GenerateProposalRequest {
    private String jobTitle;
    private String jobDescription;
    private String freelancerSkills;
}
