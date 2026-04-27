package com.bidforge.app.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
@Builder
public class ClientDashboardResponse {
        private ClientOverview overview;
        private List<ClientRecentProject> recentProjects;
        private List<RecommendedFreelancer> recommendedFreelancers;
        private List<ClientNews> news;

}
