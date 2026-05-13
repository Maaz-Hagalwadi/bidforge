package com.bidforge.app.ai.dto;

import lombok.Data;

import java.util.List;

@Data
public class ProfileSuggestions {
    private String bioRewrite;
    private String titleSuggestion;
    private List<String> skillsToAdd;
    private Integer overallScore;
    private String feedback;
}
