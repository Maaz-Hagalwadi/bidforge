package com.bidforge.app.ai.dto;

import lombok.Data;

@Data
public class BidPriceRequest {
    private String jobTitle;
    private String jobDescription;
    private String requiredSkills;
    private Double budgetMin;
    private Double budgetMax;
}
