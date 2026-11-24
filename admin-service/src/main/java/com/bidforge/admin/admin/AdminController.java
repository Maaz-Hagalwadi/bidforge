package com.bidforge.admin.admin;

import com.bidforge.admin.admin.clients.AuthAdminClient;
import com.bidforge.admin.admin.clients.ContractAdminClient;
import com.bidforge.admin.admin.clients.JobAdminClient;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/admin")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AdminController {

    private final AuthAdminClient authClient;
    private final JobAdminClient jobClient;
    private final ContractAdminClient contractClient;

    // Users
    @GetMapping("/users")
    public Object getUsers(HttpServletRequest req,
                           @RequestParam(defaultValue = "0") int page,
                           @RequestParam(defaultValue = "20") int size,
                           @RequestParam(defaultValue = "") String q) {
        return authClient.getUsers(req.getHeader("Authorization"), page, size, q);
    }

    @PatchMapping("/users/{id}/ban")
    public Object banUser(HttpServletRequest req, @PathVariable Long id) {
        return authClient.banUser(req.getHeader("Authorization"), id);
    }

    @PatchMapping("/users/{id}/unban")
    public Object unbanUser(HttpServletRequest req, @PathVariable Long id) {
        return authClient.unbanUser(req.getHeader("Authorization"), id);
    }

    @DeleteMapping("/users/{id}")
    public ResponseEntity<Void> deleteUser(HttpServletRequest req, @PathVariable Long id) {
        authClient.deleteUser(req.getHeader("Authorization"), id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/login-activity")
    public Object getLoginActivity(HttpServletRequest req,
                                   @RequestParam(defaultValue = "0") int page,
                                   @RequestParam(defaultValue = "20") int size) {
        return authClient.getLoginActivity(req.getHeader("Authorization"), page, size);
    }

    // Jobs
    @GetMapping("/jobs")
    public Object getJobs(HttpServletRequest req,
                          @RequestParam(defaultValue = "0") int page,
                          @RequestParam(defaultValue = "20") int size) {
        return jobClient.getJobs(req.getHeader("Authorization"), page, size);
    }

    // Contracts
    @GetMapping("/contracts")
    public Object getContracts(HttpServletRequest req,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        return contractClient.getContracts(req.getHeader("Authorization"), page, size);
    }

    // Disputes
    @GetMapping("/disputes")
    public Object getDisputes(HttpServletRequest req,
                              @RequestParam(defaultValue = "0") int page,
                              @RequestParam(defaultValue = "20") int size) {
        return contractClient.getDisputes(req.getHeader("Authorization"), page, size);
    }

    @PatchMapping("/disputes/{id}/under-review")
    public Object markDisputeUnderReview(HttpServletRequest req, @PathVariable UUID id) {
        return contractClient.markDisputeUnderReview(req.getHeader("Authorization"), id);
    }

    @PatchMapping("/disputes/{id}/resolve")
    public Object resolveDispute(HttpServletRequest req, @PathVariable UUID id, @RequestBody Object body) {
        return contractClient.resolveDispute(req.getHeader("Authorization"), id, body);
    }

    // Payments
    @GetMapping("/payments")
    public Object getPayments(HttpServletRequest req) {
        return contractClient.getPayments(req.getHeader("Authorization"));
    }

    // Stats (aggregated from all services)
    @GetMapping("/stats")
    public Map<String, Object> getStats(HttpServletRequest req) {
        String token = req.getHeader("Authorization");
        Map<String, Object> stats = new HashMap<>();
        try { stats.put("users", authClient.getStats(token)); } catch (Exception e) { stats.put("users", Map.of("error", "unavailable")); }
        try { stats.put("jobs", jobClient.getStats(token)); } catch (Exception e) { stats.put("jobs", Map.of("error", "unavailable")); }
        try { stats.put("contracts", contractClient.getContractStats(token)); } catch (Exception e) { stats.put("contracts", Map.of("error", "unavailable")); }
        return stats;
    }
}
