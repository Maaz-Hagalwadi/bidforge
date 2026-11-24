package com.bidforge.contract.admin;

import com.bidforge.contract.contract.ContractRepository;
import com.bidforge.contract.contract.ContractStatus;
import com.bidforge.contract.contract.dto.ContractResponse;
import com.bidforge.contract.contract.ContractService;
import com.bidforge.contract.dispute.Dispute;
import com.bidforge.contract.dispute.DisputeRepository;
import com.bidforge.contract.dispute.DisputeService;
import com.bidforge.contract.dispute.DisputeStatus;
import com.bidforge.contract.dispute.dto.DisputeResponse;
import com.bidforge.contract.payment.Payment;
import com.bidforge.contract.payment.PaymentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@RestController
@RequestMapping("/internal/admin")
@RequiredArgsConstructor
public class InternalAdminController {

    private final ContractRepository contractRepository;
    private final ContractService contractService;
    private final DisputeRepository disputeRepository;
    private final DisputeService disputeService;
    private final PaymentRepository paymentRepository;

    @GetMapping("/contracts")
    public Page<ContractResponse> getAllContracts(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return contractRepository.findAll(PageRequest.of(page, size))
                .map(contractService::mapToResponse);
    }

    @GetMapping("/disputes")
    public Page<DisputeResponse> getAllDisputes(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return disputeRepository.findAll(PageRequest.of(page, size))
                .map(disputeService::mapToResponse);
    }

    @GetMapping("/payments")
    public List<Map<String, Object>> getAllPayments() {
        return paymentRepository.findAll().stream().map(p -> Map.<String, Object>of(
                "id", p.getId(),
                "milestoneId", p.getMilestone().getId(),
                "amount", p.getAmount(),
                "status", p.getStatus(),
                "stripePaymentIntentId", p.getStripePaymentIntentId() != null ? p.getStripePaymentIntentId() : "",
                "createdAt", p.getCreatedAt()
        )).toList();
    }

    @GetMapping("/stats")
    public Map<String, Object> getStats() {
        long totalContracts = contractRepository.count();
        long activeContracts = contractRepository.countByStatus(ContractStatus.ACTIVE);
        long completedContracts = contractRepository.countByStatus(ContractStatus.COMPLETED);
        long totalDisputes = disputeRepository.count();
        long openDisputes = disputeRepository.findAll().stream()
                .filter(d -> d.getStatus() == DisputeStatus.OPEN).count();
        List<Payment> payments = paymentRepository.findAll();
        long totalPayments = payments.size();
        double totalAmountEscrowed = payments.stream()
                .mapToDouble(Payment::getAmount).sum();
        double totalAmountReleased = payments.stream()
                .filter(p -> p.getStatus() == com.bidforge.contract.payment.PaymentStatus.RELEASED)
                .mapToDouble(Payment::getAmount).sum();

        return Map.of(
                "totalContracts", totalContracts,
                "activeContracts", activeContracts,
                "completedContracts", completedContracts,
                "totalDisputes", totalDisputes,
                "openDisputes", openDisputes,
                "totalPayments", totalPayments,
                "totalAmountEscrowed", totalAmountEscrowed,
                "totalAmountReleased", totalAmountReleased
        );
    }

    @PatchMapping("/disputes/{id}/under-review")
    public DisputeResponse markUnderReview(@PathVariable UUID id) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));
        dispute.setStatus(DisputeStatus.UNDER_REVIEW);
        return disputeService.mapToResponse(disputeRepository.save(dispute));
    }

    @PatchMapping("/disputes/{id}/resolve")
    public DisputeResponse resolveDispute(@PathVariable UUID id,
                                          @RequestBody Map<String, String> body) {
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));
        dispute.setStatus(DisputeStatus.RESOLVED);
        dispute.setResolution(body.get("resolution"));
        dispute.setResolvedAt(LocalDateTime.now());
        return disputeService.mapToResponse(disputeRepository.save(dispute));
    }
}
