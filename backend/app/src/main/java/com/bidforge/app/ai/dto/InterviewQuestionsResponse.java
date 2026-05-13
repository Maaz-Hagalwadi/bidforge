package com.bidforge.app.ai.dto;

import lombok.Data;

import java.util.List;

@Data
public class InterviewQuestionsResponse {
    private List<String> questions;

    public InterviewQuestionsResponse(List<String> questions) {
        this.questions = questions;
    }

    public InterviewQuestionsResponse() {}
}
