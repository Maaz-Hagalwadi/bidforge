package com.bidforge.app.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FreelancerOverview {

    private long activeBids;
    private int bidsEndingSoon;

    private long ongoingContracts;
    private double successRate;

    private long completedJobs;
    private double totalEarned;
}
