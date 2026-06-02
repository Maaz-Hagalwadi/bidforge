package com.bidforge.app.admin;

import com.bidforge.app.admin.dto.AdminDisputeResponse;
import com.bidforge.app.admin.dto.AdminPaymentResponse;
import com.bidforge.app.admin.dto.AdminStatsResponse;
import com.bidforge.app.admin.dto.AdminUserResponse;
import com.bidforge.app.admin.dto.LoginActivityResponse;
import com.bidforge.app.admin.dto.TimeSeriesPoint;
import com.bidforge.app.job.dto.response.JobResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@PreAuthorize("hasRole('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final AdminService adminService;

    @GetMapping("/stats")
    public AdminStatsResponse getStats() {
        return adminService.getStats();
    }

    @GetMapping("/users")
    public Page<AdminUserResponse> getUsers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String role,
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String status) {
        return adminService.getUsers(page, size, role, q, status);
    }

    @PatchMapping("/users/{id}/ban")
    public ResponseEntity<Void> banUser(@PathVariable Long id) {
        adminService.banUser(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{id}/unban")
    public ResponseEntity<Void> unbanUser(@PathVariable Long id) {
        adminService.unbanUser(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(@PathVariable Long id) {
        adminService.deleteUser(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/jobs")
    public Page<JobResponse> getJobs(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return adminService.getJobs(page, size, status);
    }

    @GetMapping("/disputes")
    public Page<AdminDisputeResponse> getDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return adminService.getDisputes(page, size, status);
    }

    @PatchMapping("/disputes/{id}/under-review")
    public AdminDisputeResponse markDisputeUnderReview(@PathVariable UUID id) {
        return adminService.markDisputeUnderReview(id);
    }

    @PatchMapping("/disputes/{id}/resolve")
    public AdminDisputeResponse resolveDispute(
            @PathVariable UUID id,
            @RequestBody Map<String, String> body) {
        return adminService.resolveAdminDispute(id, body.getOrDefault("resolutionNote", ""));
    }

    @GetMapping("/payments")
    public Page<AdminPaymentResponse> getPayments(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status) {
        return adminService.getPayments(page, size, status);
    }

    @GetMapping("/payments/summary")
    public Map<String, Object> getPaymentSummary() {
        return Map.of(
            "totalRevenue", adminService.getStats().getTotalRevenue(),
            "escrowed", adminService.getEscrowedAmount()
        );
    }

    @GetMapping("/analytics/revenue")
    public List<TimeSeriesPoint> revenueByMonth(
            @RequestParam(defaultValue = "12") int months) {
        return adminService.getRevenueByMonth(months);
    }

    @GetMapping("/analytics/users")
    public List<TimeSeriesPoint> usersJoinedByWeek(
            @RequestParam(defaultValue = "12") int weeks) {
        return adminService.getUsersJoinedByWeek(weeks);
    }

    @GetMapping("/analytics/bids")
    public List<TimeSeriesPoint> bidsPerCategory() {
        return adminService.getBidsPerCategory();
    }

    @GetMapping("/analytics/disputes")
    public List<TimeSeriesPoint> disputeResolutionTime(
            @RequestParam(defaultValue = "12") int months) {
        return adminService.getDisputeResolutionTime(months);
    }

    @GetMapping("/login-activity")
    public Page<LoginActivityResponse> getLoginActivity(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) Long userId) {
        return adminService.getLoginActivity(page, size, userId);
    }
}
