package com.bidforge.app.ai.dto;

import lombok.Data;

@Data
public class GenerateDescriptionRequest {
    private String title;
    private String notes;
    private String category;
}
