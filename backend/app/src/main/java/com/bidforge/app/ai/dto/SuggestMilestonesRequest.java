package com.bidforge.app.ai.dto;

import lombok.Data;

@Data
public class SuggestMilestonesRequest {
    private String jobTitle;
    private String jobDescription;
    private Double totalAmount;
    private Integer deliveryDays;
}
