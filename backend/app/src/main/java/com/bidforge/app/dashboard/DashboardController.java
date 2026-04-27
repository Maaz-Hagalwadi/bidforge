package com.bidforge.app.dashboard;

import com.bidforge.app.dashboard.dto.response.ClientDashboardResponse;
import com.bidforge.app.dashboard.dto.response.FreelancerDashboardResponse;
import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    @GetMapping("/client/dashboard")
    @PreAuthorize("hasRole('CLIENT')")
    public ClientDashboardResponse clientDashboard() {
        return dashboardService.getClientDashboard(getCurrentUser());
    }

    @GetMapping("/freelancer/dashboard")
    @PreAuthorize("hasRole('FREELANCER')")
    public FreelancerDashboardResponse freelancerDashboard() {
        return dashboardService.getFreelancerDashboard(getCurrentUser());
    }
}
