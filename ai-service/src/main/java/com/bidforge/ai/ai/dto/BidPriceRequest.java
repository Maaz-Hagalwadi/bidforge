package com.bidforge.ai.ai.dto;

import lombok.Data;

@Data
public class BidPriceRequest {
    private String jobTitle;
    private String jobDescription;
    private String budgetRange;
}
