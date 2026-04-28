package com.bidforge.app.bid;

import com.bidforge.app.bid.dto.BidResponse;
import com.bidforge.app.bid.dto.CreateBidRequest;
import com.bidforge.app.user.User;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class BidController {

    private final BidService bidService;

    private User getCurrentUser() {
        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }

    @PostMapping("/{jobId}/bids")
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
