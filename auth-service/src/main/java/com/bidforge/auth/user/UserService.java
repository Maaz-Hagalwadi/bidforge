package com.bidforge.auth.user;

import com.bidforge.auth.common.exception.UserNotFoundException;
import com.bidforge.auth.user.dto.request.UpdateUserRequest;
import com.bidforge.auth.user.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;

    public UserResponse getCurrentUser() {
        return mapToResponse(getAuthenticatedUser());
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
        return mapToResponse(userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found")));
    }

    public List<UserResponse> searchFreelancers(String q) {
        return userRepository.searchByRoleAndQuery(Role.FREELANCER, q == null ? "" : q, PageRequest.of(0, 50))
                .stream().map(this::mapToResponse).toList();
    }

    private User getAuthenticatedUser() {
        return (User) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
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
}
