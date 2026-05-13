package com.bidforge.app.admin;

import com.bidforge.app.admin.dto.TimeSeriesPoint;
import com.bidforge.app.notification.EmailService;
import com.bidforge.app.notification.NotificationService;
import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.admin.dto.AdminDisputeResponse;
import com.bidforge.app.admin.dto.AdminPaymentResponse;
import com.bidforge.app.admin.dto.AdminStatsResponse;
import com.bidforge.app.admin.dto.AdminUserResponse;
import com.bidforge.app.contract.ContractRepository;
import com.bidforge.app.contract.ContractStatus;
import com.bidforge.app.dispute.Dispute;
import com.bidforge.app.dispute.DisputeRepository;
import com.bidforge.app.dispute.DisputeStatus;
import com.bidforge.app.job.JobRepository;
import com.bidforge.app.job.JobService;
import com.bidforge.app.job.dto.response.JobResponse;
import com.bidforge.app.job.enums.JobStatus;
import com.bidforge.app.payment.Payment;
import com.bidforge.app.payment.PaymentRepository;
import com.bidforge.app.payment.PaymentStatus;
import com.bidforge.app.user.Role;
import com.bidforge.app.user.User;
import com.bidforge.app.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final JobRepository jobRepository;
    private final JobService jobService;
    private final ContractRepository contractRepository;
    private final PaymentRepository paymentRepository;
    private final DisputeRepository disputeRepository;
    private final NotificationService notificationService;
    private final EmailService emailService;
    private final com.bidforge.app.bid.BidRepository bidRepository;

    public AdminStatsResponse getStats() {
        return AdminStatsResponse.builder()
                .totalUsers(userRepository.count())
                .totalClients(userRepository.countByRole(Role.CLIENT))
                .totalFreelancers(userRepository.countByRole(Role.FREELANCER))
                .bannedUsers(userRepository.countByBanned(true))
                .pendingVerifications(userRepository.countByEmailVerifiedFalseAndBannedFalse())
                .totalJobs(jobRepository.count())
                .openJobs(jobRepository.countByStatus(JobStatus.OPEN))
                .totalContracts(contractRepository.count())
                .activeContracts(contractRepository.countByStatus(ContractStatus.ACTIVE))
                .completedContracts(contractRepository.countByStatus(ContractStatus.COMPLETED))
                .totalRevenue(paymentRepository.sumReleasedAmount())
                .build();
    }

    public Page<AdminUserResponse> getUsers(int page, int size, String role, String q, String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String search = (q == null) ? "" : q.trim();
        String statusFilter = (status == null || status.isBlank()) ? "ALL" : status.toUpperCase();
        Role roleEnum = (role != null && !role.isBlank()) ? Role.valueOf(role.toUpperCase()) : null;

        return userRepository.findAllForAdmin(roleEnum, search, statusFilter, pageable)
                .map(AdminUserResponse::from);
    }

    @Transactional
    public void banUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == Role.ADMIN) throw new RuntimeException("Cannot ban an admin");
        user.setBanned(true);
        userRepository.save(user);
        emailService.sendUserBannedEmail(user.getEmail(), user.getName());
        notifyAdmins("User Banned",
                user.getName() + " (" + user.getEmail() + ") has been banned.",
                NotificationType.USER_BANNED, null);
    }

    @Transactional
    public void unbanUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        user.setBanned(false);
        userRepository.save(user);
        emailService.sendUserUnbannedEmail(user.getEmail(), user.getName());
    }

    @Transactional
    public void deleteUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new RuntimeException("User not found"));
        if (user.getRole() == Role.ADMIN) throw new RuntimeException("Cannot delete an admin");
        userRepository.delete(user);
    }

    public Page<JobResponse> getJobs(int page, int size, String status) {
        JobStatus jobStatus = (status != null && !status.isEmpty())
                ? JobStatus.valueOf(status.toUpperCase()) : null;
        return jobService.getJobsAdminPaged(page, size, jobStatus);
    }

    @Transactional(readOnly = true)
    public Page<AdminDisputeResponse> getDisputes(int page, int size, String status) {
        PageRequest pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Dispute> disputes = (status != null && !status.isBlank())
                ? disputeRepository.findByStatus(DisputeStatus.valueOf(status.toUpperCase()), pageable)
                : disputeRepository.findAll(pageable);
        return disputes.map(this::mapDispute);
    }

    @Transactional
    public AdminDisputeResponse markDisputeUnderReview(UUID disputeId) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
        dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        return mapDispute(disputeRepository.save(dispute));
    }

    @Transactional
    public AdminDisputeResponse resolveAdminDispute(UUID disputeId, String note) {
        Dispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Dispute not found"));
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolutionNote(note);
        dispute.setResolvedAt(LocalDateTime.now());
        AdminDisputeResponse response = mapDispute(disputeRepository.save(dispute));
        String jobTitle = dispute.getContract().getJob().getTitle();
        User client = dispute.getContract().getClient();
        User freelancer = dispute.getContract().getFreelancer();
        emailService.sendDisputeResolvedEmail(client.getEmail(), client.getName(), jobTitle, note);
        emailService.sendDisputeResolvedEmail(freelancer.getEmail(), freelancer.getName(), jobTitle, note);
        notificationService.createNotification(client, "Dispute Resolved",
                "The dispute for \"" + jobTitle + "\" has been resolved.",
                NotificationType.DISPUTE_OPENED, disputeId);
        notificationService.createNotification(freelancer, "Dispute Resolved",
                "The dispute for \"" + jobTitle + "\" has been resolved.",
                NotificationType.DISPUTE_OPENED, disputeId);
        return response;
    }

    private void notifyAdmins(String title, String message, NotificationType type, UUID referenceId) {
        userRepository.findByRole(Role.ADMIN)
                .forEach(admin -> notificationService.createNotification(admin, title, message, type, referenceId));
    }

    private AdminDisputeResponse mapDispute(Dispute d) {
        return AdminDisputeResponse.builder()
                .id(d.getId())
                .contractId(d.getContract().getId())
                .jobTitle(d.getContract().getJob().getTitle())
                .openedByName(d.getOpenedBy().getName())
                .reason(d.getReason())
                .status(d.getStatus())
                .resolutionNote(d.getResolutionNote())
                .createdAt(d.getCreatedAt())
                .build();
    }

    @Transactional(readOnly = true)
    public Page<AdminPaymentResponse> getPayments(int page, int size, String status) {
        PageRequest pageable = PageRequest.of(page, size);
        Page<Payment> payments = (status != null && !status.isBlank())
                ? paymentRepository.findAllWithDetailsByStatus(PaymentStatus.valueOf(status.toUpperCase()), pageable)
                : paymentRepository.findAllWithDetails(pageable);
        return payments.map(this::mapPayment);
    }

    public double getEscrowedAmount() {
        return paymentRepository.sumEscrowedAmount();
    }

    public List<TimeSeriesPoint> getRevenueByMonth(int months) {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusMonths(months);
        return paymentRepository.revenueByMonth(since).stream()
                .map(r -> new TimeSeriesPoint((String) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }

    public List<TimeSeriesPoint> getUsersJoinedByWeek(int weeks) {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusWeeks(weeks);
        return userRepository.usersJoinedByWeek(since).stream()
                .map(r -> new TimeSeriesPoint((String) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }

    public List<TimeSeriesPoint> getBidsPerCategory() {
        return bidRepository.bidsPerCategory().stream()
                .map(r -> new TimeSeriesPoint((String) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }

    public List<TimeSeriesPoint> getDisputeResolutionTime(int months) {
        java.time.LocalDateTime since = java.time.LocalDateTime.now().minusMonths(months);
        return disputeRepository.avgResolutionHoursByMonth(since).stream()
                .map(r -> new TimeSeriesPoint((String) r[0], ((Number) r[1]).doubleValue()))
                .toList();
    }

    private AdminPaymentResponse mapPayment(Payment p) {
        var milestone = p.getMilestone();
        var contract = milestone.getContract();
        return AdminPaymentResponse.builder()
                .id(p.getId())
                .milestoneTitle(milestone.getTitle())
                .contractId(contract.getId())
                .clientName(contract.getClient().getName())
                .freelancerName(contract.getFreelancer().getName())
                .amount(p.getAmount())
                .status(p.getStatus())
                .createdAt(p.getCreatedAt())
                .build();
    }
}
