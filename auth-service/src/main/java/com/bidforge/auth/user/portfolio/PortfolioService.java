package com.bidforge.auth.user.portfolio;

import com.bidforge.auth.user.User;
import com.bidforge.auth.user.portfolio.dto.PortfolioRequest;
import com.bidforge.auth.user.portfolio.dto.PortfolioResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class PortfolioService {

    private final PortfolioRepository portfolioRepository;

    public List<PortfolioResponse> getPortfolioByUserId(Long userId) {
        return portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    public PortfolioResponse addPortfolioItem(PortfolioRequest req) {
        User user = getAuthenticatedUser();
        PortfolioItem item = PortfolioItem.builder()
                .user(user)
                .title(req.getTitle())
                .description(req.getDescription())
                .imageUrl(req.getImageUrl())
                .projectUrl(req.getProjectUrl())
                .build();
        return mapToResponse(portfolioRepository.save(item));
    }

    public PortfolioResponse updatePortfolioItem(Long itemId, PortfolioRequest req) {
        User user = getAuthenticatedUser();
        PortfolioItem item = portfolioRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio item not found"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this portfolio item");
        }
        if (req.getTitle() != null) item.setTitle(req.getTitle());
        if (req.getDescription() != null) item.setDescription(req.getDescription());
        if (req.getImageUrl() != null) item.setImageUrl(req.getImageUrl());
        if (req.getProjectUrl() != null) item.setProjectUrl(req.getProjectUrl());
        return mapToResponse(portfolioRepository.save(item));
    }

    public void deletePortfolioItem(Long itemId) {
        User user = getAuthenticatedUser();
        PortfolioItem item = portfolioRepository.findById(itemId)
                .orElseThrow(() -> new IllegalArgumentException("Portfolio item not found"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new AccessDeniedException("You do not own this portfolio item");
        }
        portfolioRepository.delete(item);
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    private PortfolioResponse mapToResponse(PortfolioItem item) {
        return PortfolioResponse.builder()
                .id(item.getId())
                .userId(item.getUser().getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .projectUrl(item.getProjectUrl())
                .createdAt(item.getCreatedAt())
                .build();
    }
}
