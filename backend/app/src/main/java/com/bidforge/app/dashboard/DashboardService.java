package com.bidforge.app.dashboard;

import com.bidforge.app.dashboard.dto.response.*;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    // later: JobRepository, BidRepository

    public ClientDashboardResponse getClientDashboard(User user) {

        ClientOverview overview = ClientOverview.builder()
                .activeJobs(12)
                .activeJobsChangePercent(48)
                .totalBids(156)
                .bidsChange("No change")
                .ongoingContracts(8)
                .contractsChangePercent(-12)
                .totalSpent(24500)
                .build();

        List<ClientRecentProject> projects = List.of(
                ClientRecentProject.builder()
                        .title("Senior UX/UI Designer for Fintech App")
                        .status("OPEN")
                        .bidsReceived(24)
                        .budget("$5k – $8k")
                        .postedTime("2 hours ago")
                        .build()
        );

        List<RecommendedFreelancer> freelancers = List.of(
                RecommendedFreelancer.builder()
                        .name("Julia Stevens")
                        .title("Python Specialist")
                        .rating(4.9)
                        .reviewsCount(124)
                        .build()
        );

        List<ClientNews> news = List.of(
                ClientNews.builder()
                        .title("Escrow 2.0 is now live")
                        .description("Secure your project funds with better milestone release")
                        .build()
        );

        return ClientDashboardResponse.builder()
                .overview(overview)
                .recentProjects(projects)
                .recommendedFreelancers(freelancers)
                .news(news)
                .build();
    }

    public FreelancerDashboardResponse getFreelancerDashboard(User user) {

        FreelancerOverview overview = FreelancerOverview.builder()
                .activeBids(0)
                .bidsEndingSoon(2)
                .ongoingContracts(0)
                .successRate(99.0)
                .completedJobs(0)
                .totalEarned(12450)
                .build();

        List<FreelancerRecentActivity> activities = List.of(
                FreelancerRecentActivity.builder()
                        .type("BID")
                        .title("New Bid Submitted")
                        .description("Logo Design for Startup")
                        .time("2 hours ago")
                        .build(),

                FreelancerRecentActivity.builder()
                        .type("PAYMENT")
                        .title("Payment Received")
                        .description("$850 for Web Redesign Project")
                        .time("Yesterday")
                        .build(),

                FreelancerRecentActivity.builder()
                        .type("REVIEW")
                        .title("New Review Left")
                        .description("5-star rating from Sarah Chen")
                        .time("3 days ago")
                        .build()
        );

        ProfileCompletion profile = ProfileCompletion.builder()
                .percentage(85)
                .portfolioAdded(true)
                .skillsAdded(true)
                .bioAdded(true)
                .build();

        return FreelancerDashboardResponse.builder()
                .welcomeMessage("Welcome back, " + user.getName() + " 👋")
                .overview(overview)
                .recentActivities(activities)
                .profileCompletion(profile)
                .build();
    }
}
