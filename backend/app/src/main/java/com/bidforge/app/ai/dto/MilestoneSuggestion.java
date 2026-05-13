package com.bidforge.app.ai.dto;

import lombok.Data;

@Data
public class MilestoneSuggestion {
    private String title;
    private String description;
    private Double amount;
    private Integer dueDays;
}
