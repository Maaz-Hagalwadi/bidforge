package com.bidforge.app.dashboard.dto.response;
import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class FreelancerDashboardResponse {

    private String welcomeMessage;
    private FreelancerOverview overview;
    private List<FreelancerRecentActivity> recentActivities;
    private ProfileCompletion profileCompletion;
}