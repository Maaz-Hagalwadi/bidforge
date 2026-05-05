package com.bidforge.app.dashboard;

import com.bidforge.app.bid.Bid;
import com.bidforge.app.bid.BidRepository;
import com.bidforge.app.bid.BidStatus;
import com.bidforge.app.contract.Contract;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.contract.ContractStatus;
import com.bidforge.app.dashboard.dto.response.*;
import com.bidforge.app.job.Job;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.review.ReviewRepository;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DashboardService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final BidRepository bidRepository;
    private final ContractRepository contractRepository;
    private final ReviewRepository reviewRepository;

    @Transactional(readOnly = true)
    public ClientDashboardResponse getClientDashboard(User client) {

        List<Job> allJobs = jobRepository.findByClient(client);
        List<Contract> allContracts = contractRepository.findByClientId(client.getId());

        long activeJobs = allJobs.stream().filter(j -> j.getStatus() == JobStatus.OPEN).count();

        long totalBids = allJobs.stream()
                .mapToLong(j -> bidRepository.findByJob(j).size())
                .sum();

        long ongoingContracts = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .count();

        double totalSpent = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.COMPLETED)
                .mapToDouble(c -> c.getAgreedAmount() != null ? c.getAgreedAmount() : 0)
                .sum();

        ClientOverview overview = ClientOverview.builder()
                .activeJobs(activeJobs)
                .activeJobsChangePercent(0)
                .totalBids(totalBids)
                .bidsChange("All time")
                .ongoingContracts(ongoingContracts)
                .contractsChangePercent(0)
                .totalSpent(totalSpent)
                .build();

        // Last 5 jobs sorted by newest
        List<Job> recentJobs = allJobs.stream()
                .sorted(Comparator.comparing(Job::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .collect(Collectors.toList());

        List<ClientRecentProject> projects = recentJobs.stream().map(j -> {
            int bidsCount = bidRepository.findByJob(j).size();
            String dueDate = null;
            String assignedTo = null;
            double totalValue = 0;
            boolean paidOut = false;

            if (j.getStatus() == JobStatus.ASSIGNED || j.getStatus() == JobStatus.COMPLETED) {
                Optional<Contract> contractOpt = contractRepository.findByJob(j);
                if (contractOpt.isPresent()) {
                    Contract c = contractOpt.get();
                    assignedTo = c.getFreelancer().getName();
                    totalValue = c.getAgreedAmount() != null ? c.getAgreedAmount() : 0;
                    paidOut = c.getStatus() == ContractStatus.COMPLETED;
                    if (j.getDeadline() != null) {
                        dueDate = j.getDeadline().toLocalDate().toString();
                    }
                }
            }

            return ClientRecentProject.builder()
                    .title(j.getTitle())
                    .status(j.getStatus().name())
                    .budget(formatBudget(j.getBudgetMin(), j.getBudgetMax()))
                    .postedTime(timeAgo(j.getCreatedAt()))
                    .bidsReceived(bidsCount)
                    .assignedTo(assignedTo)
                    .totalValue(totalValue)
                    .paidOut(paidOut)
                    .dueDate(dueDate)
                    .build();
        }).collect(Collectors.toList());

        // Top freelancers by rating, unrated fall to the bottom
        List<RecommendedFreelancer> freelancers = userRepository.findByRole(Role.FREELANCER).stream()
                .sorted((a, b) -> {
                    double ra = a.getRating() != null ? a.getRating() : 0.0;
                    double rb = b.getRating() != null ? b.getRating() : 0.0;
                    return Double.compare(rb, ra);
                })
                .limit(4)
                .map(u -> RecommendedFreelancer.builder()
                        .name(u.getName())
                        .title(u.getTitle() != null ? u.getTitle() : "Freelancer")
                        .rating(u.getRating() != null ? u.getRating() : 0.0)
                        .reviewsCount(reviewRepository.countByReviewee(u))
                        .build())
                .collect(Collectors.toList());

        List<ClientNews> news = List.of(
                ClientNews.builder()
                        .title("Escrow Protection Active")
                        .description("Your project payments are secured by BidForge's verified escrow system for every contract.")
                        .build()
        );

        return ClientDashboardResponse.builder()
                .overview(overview)
                .recentProjects(projects)
                .recommendedFreelancers(freelancers)
                .news(news)
                .build();
    }

    @Transactional(readOnly = true)
    public FreelancerDashboardResponse getFreelancerDashboard(User freelancer) {

        List<Bid> allBids = bidRepository.findByFreelancer(freelancer);
        List<Contract> allContracts = contractRepository.findByFreelancerId(freelancer.getId());

        long activeBids = allBids.stream()
                .filter(b -> b.getStatus() == BidStatus.PENDING)
                .count();

        long ongoingContracts = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.ACTIVE)
                .count();

        long completedJobs = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.COMPLETED)
                .count();

        long cancelledContracts = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.CANCELLED)
                .count();

        long totalForRate = completedJobs + cancelledContracts;
        double successRate = totalForRate > 0 ? Math.round((completedJobs * 100.0 / totalForRate) * 10.0) / 10.0 : 100.0;

        double totalEarned = allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.COMPLETED)
                .mapToDouble(c -> c.getAgreedAmount() != null ? c.getAgreedAmount() : 0)
                .sum();

        // bidsEndingSoon: pending bids on jobs with deadline within 7 days
        LocalDateTime sevenDaysFromNow = LocalDateTime.now().plusDays(7);
        long bidsEndingSoon = allBids.stream()
                .filter(b -> b.getStatus() == BidStatus.PENDING)
                .filter(b -> b.getJob().getDeadline() != null
                        && b.getJob().getDeadline().isBefore(sevenDaysFromNow))
                .count();

        FreelancerOverview overview = FreelancerOverview.builder()
                .activeBids(activeBids)
                .bidsEndingSoon((int) bidsEndingSoon)
                .ongoingContracts(ongoingContracts)
                .successRate(successRate)
                .completedJobs(completedJobs)
                .totalEarned(totalEarned)
                .build();

        // Recent activities: latest bids + latest completed contracts
        List<FreelancerRecentActivity> activities = new ArrayList<>();

        allBids.stream()
                .sorted(Comparator.comparing(Bid::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(4)
                .forEach(b -> activities.add(FreelancerRecentActivity.builder()
                        .type("BID")
                        .title("Bid Submitted")
                        .description("$" + (b.getAmount() != null ? b.getAmount().intValue() : 0)
                                + " for " + b.getJob().getTitle())
                        .time(timeAgo(b.getCreatedAt()))
                        .build()));

        allContracts.stream()
                .filter(c -> c.getStatus() == ContractStatus.COMPLETED)
                .sorted(Comparator.comparing(Contract::getCreatedAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(2)
                .forEach(c -> activities.add(FreelancerRecentActivity.builder()
                        .type("PAYMENT")
                        .title("Payment Received")
                        .description("$" + (c.getAgreedAmount() != null ? c.getAgreedAmount().intValue() : 0)
                                + " for " + c.getJob().getTitle())
                        .time(timeAgo(c.getCreatedAt()))
                        .build()));

        // Profile completion
        boolean bioAdded = freelancer.getBio() != null && !freelancer.getBio().isBlank();
        boolean skillsAdded = freelancer.getSkills() != null && !freelancer.getSkills().isBlank();
        boolean portfolioAdded = freelancer.getTitle() != null && !freelancer.getTitle().isBlank();
        int pct = 30;
        if (bioAdded) pct += 25;
        if (skillsAdded) pct += 25;
        if (portfolioAdded) pct += 10;
        if (freelancer.getProfileImageUrl() != null && !freelancer.getProfileImageUrl().isBlank()) pct += 10;

        ProfileCompletion profileCompletion = ProfileCompletion.builder()
                .percentage(Math.min(pct, 100))
                .portfolioAdded(portfolioAdded)
                .skillsAdded(skillsAdded)
                .bioAdded(bioAdded)
                .build();

        return FreelancerDashboardResponse.builder()
                .welcomeMessage("Welcome back, " + freelancer.getName() + " 👋")
                .overview(overview)
                .recentActivities(activities)
                .profileCompletion(profileCompletion)
                .build();
    }

    private String timeAgo(LocalDateTime dt) {
        if (dt == null) return "Recently";
        Duration d = Duration.between(dt, LocalDateTime.now());
        long minutes = d.toMinutes();
        if (minutes < 1) return "Just now";
        if (minutes < 60) return minutes + " min ago";
        long hours = d.toHours();
        if (hours < 24) return hours + " hr" + (hours == 1 ? "" : "s") + " ago";
        long days = d.toDays();
        if (days == 1) return "Yesterday";
        return days + " days ago";
    }

    private String formatBudget(Double min, Double max) {
        if (min == null && max == null) return "Flexible";
        if (max == null) return "$" + formatAmount(min.intValue()) + "+";
        if (min == null) return "Up to $" + formatAmount(max.intValue());
        return "$" + formatAmount(min.intValue()) + " – $" + formatAmount(max.intValue());
    }

    private String formatAmount(int amount) {
        if (amount >= 1_000_000) return (amount / 1_000_000) + "M";
        if (amount >= 1_000) return (amount / 1_000) + "k";
        return String.valueOf(amount);
    }
}
