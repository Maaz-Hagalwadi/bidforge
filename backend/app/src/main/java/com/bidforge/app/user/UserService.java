package com.bidforge.app.user;

import com.bidforge.app.common.exception.UserNotFoundException;
import com.bidforge.app.user.dto.request.PortfolioRequest;
import com.bidforge.app.user.dto.request.UpdateUserRequest;
import com.bidforge.app.user.dto.response.PortfolioResponse;
import com.bidforge.app.user.dto.response.UserResponse;
import com.stripe.model.Account;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Map;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PortfolioRepository portfolioRepository;

    public UserResponse getCurrentUser() {
        User user = getAuthenticatedUser();
        return mapToResponse(user);
    }

    public UserResponse updateCurrentUser(UpdateUserRequest request) {

        User user = getAuthenticatedUser();

        if (request.getName() != null) user.setName(request.getName());
        if (request.getProfileImageUrl() != null) user.setProfileImageUrl(request.getProfileImageUrl());
        if (request.getTitle() != null) user.setTitle(request.getTitle());
        if (request.getBio() != null) user.setBio(request.getBio());
        if (request.getLocation() != null) user.setLocation(request.getLocation());
        if (request.getHourlyRate() != null) user.setHourlyRate(request.getHourlyRate());
        if (request.getSkills() != null) user.setSkills(request.getSkills());

        return mapToResponse(userRepository.save(user));
    }

    public UserResponse getUserById(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        return mapToResponse(user);
    }

    public List<UserResponse> searchFreelancers(String q) {
        return userRepository.searchByRoleAndQuery(Role.FREELANCER, q, PageRequest.of(0, 10))
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder
                .getContext()
                .getAuthentication()
                .getPrincipal();
    }



    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .phoneNumber(user.getPhoneNumber())
                .role(user.getRole())
                .rating(user.getRating())
                .profileImageUrl(user.getProfileImageUrl())
                .title(user.getTitle())
                .bio(user.getBio())
                .location(user.getLocation())
                .hourlyRate(user.getHourlyRate())
                .skills(user.getSkills())
                .createdAt(user.getCreatedAt())
                .build();
    }

    public List<PortfolioResponse> getPortfolio(Long userId) {
        return portfolioRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::mapPortfolioToResponse)
                .toList();
    }

    public PortfolioResponse addPortfolioItem(PortfolioRequest request) {
        User user = getAuthenticatedUser();
        PortfolioItem item = PortfolioItem.builder()
                .user(user)
                .title(request.getTitle())
                .description(request.getDescription())
                .imageUrl(request.getImageUrl())
                .projectUrl(request.getProjectUrl())
                .technologies(request.getTechnologies())
                .build();
        return mapPortfolioToResponse(portfolioRepository.save(item));
    }

    public void deletePortfolioItem(UUID itemId) {
        User user = getAuthenticatedUser();
        PortfolioItem item = portfolioRepository.findById(itemId)
                .orElseThrow(() -> new RuntimeException("Portfolio item not found"));
        if (!item.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Not your portfolio item");
        }
        portfolioRepository.delete(item);
    }

    private PortfolioResponse mapPortfolioToResponse(PortfolioItem item) {
        return PortfolioResponse.builder()
                .id(item.getId())
                .title(item.getTitle())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .projectUrl(item.getProjectUrl())
                .technologies(item.getTechnologies())
                .createdAt(item.getCreatedAt())
                .build();
    }
}