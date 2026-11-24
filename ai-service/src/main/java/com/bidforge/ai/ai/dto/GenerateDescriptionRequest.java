package com.bidforge.ai.ai.dto;

import lombok.Data;

@Data
public class GenerateDescriptionRequest {
    private String title;
    private String category;
    private String skills;
}
