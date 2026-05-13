package com.bidforge.app.ai.dto;

import lombok.Data;

import java.util.List;

@Data
public class ResumeSkillsResponse {
    private List<String> skills;

    public ResumeSkillsResponse(List<String> skills) {
        this.skills = skills;
    }

    public ResumeSkillsResponse() {}
}
