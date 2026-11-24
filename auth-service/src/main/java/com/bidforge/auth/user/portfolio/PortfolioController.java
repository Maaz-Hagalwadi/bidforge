package com.bidforge.auth.user.portfolio;

import com.bidforge.auth.user.portfolio.dto.PortfolioRequest;
import com.bidforge.auth.user.portfolio.dto.PortfolioResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class PortfolioController {

    private final PortfolioService portfolioService;

    @GetMapping("/users/{userId}/portfolio")
    public List<PortfolioResponse> getPortfolioByUserId(@PathVariable Long userId) {
        return portfolioService.getPortfolioByUserId(userId);
    }

    @PostMapping("/users/me/portfolio")
    public PortfolioResponse addPortfolioItem(@Valid @RequestBody PortfolioRequest request) {
        return portfolioService.addPortfolioItem(request);
    }

    @PutMapping("/users/me/portfolio/{itemId}")
    public PortfolioResponse updatePortfolioItem(
            @PathVariable Long itemId,
            @Valid @RequestBody PortfolioRequest request) {
        return portfolioService.updatePortfolioItem(itemId, request);
    }

    @DeleteMapping("/users/me/portfolio/{itemId}")
    public ResponseEntity<Void> deletePortfolioItem(@PathVariable Long itemId) {
        portfolioService.deletePortfolioItem(itemId);
        return ResponseEntity.noContent().build();
    }
}
