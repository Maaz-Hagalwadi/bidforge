package com.bidforge.app.admin.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class AdminStatsResponse {
    private long totalUsers;
    private long totalClients;
    private long totalFreelancers;
    private long bannedUsers;
    private long pendingVerifications;
    private long totalJobs;
    private long openJobs;
    private long totalContracts;
    private long activeContracts;
    private long completedContracts;
    private double totalRevenue;
}
