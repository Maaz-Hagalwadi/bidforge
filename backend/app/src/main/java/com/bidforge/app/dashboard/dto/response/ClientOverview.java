package com.bidforge.app.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ClientOverview {

    private long activeJobs;
    private double activeJobsChangePercent;

    private long totalBids;
    private String bidsChange; // "No change"

    private long ongoingContracts;
    private double contractsChangePercent;

    private double totalSpent;
}
