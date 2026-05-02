package com.bidforge.app.milestone.dto;

import lombok.Builder;
import lombok.Getter;

@Getter
@Builder
public class MilestoneSummary {

    private long total;
    private long funded;
    private long submitted;
    private long approved;

    private double totalAmount;
    private double releasedAmount;
}