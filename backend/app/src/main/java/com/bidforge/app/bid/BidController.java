package com.bidforge.app.bid;

import com.bidforge.app.bid.dto.BidResponse;
import com.bidforge.app.bid.dto.CreateBidRequest;
import com.bidforge.app.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    @GetMapping("/jobs/{jobId}/bids")
    @PreAuthorize("hasRole('CLIENT')")
    public Page<BidResponse> getBids(
            @PathVariable UUID jobId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size
    ) {
        return bidService.getBidsForJob(jobId, getCurrentUser(), PageRequest.of(page, size));
    }

    @PostMapping("/bids/{bidId}/accept")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<String> acceptBid(@PathVariable UUID bidId) {

        bidService.acceptBid(bidId, getCurrentUser());

        return ResponseEntity.ok("Bid accepted successfully");
    }

    @GetMapping("/bids/my")
    @PreAuthorize("hasRole('FREELANCER')")
    public List<BidResponse> getMyBids() {
        return bidService.getMyBids(getCurrentUser());
    }

    @PostMapping("/bids/{bidId}/decline")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<String> declineBid(@PathVariable UUID bidId) {
        bidService.declineBid(bidId, getCurrentUser());
        return ResponseEntity.ok("Bid declined");
    }

    @PostMapping("/jobs/{jobId}/bids")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<BidResponse> createBid(
            @PathVariable UUID jobId,
            @Valid @RequestBody CreateBidRequest request
    ) {
        return ResponseEntity.ok(
                bidService.createBid(jobId, request, getCurrentUser())
        );
    }
}
