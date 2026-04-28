package com.bidforge.app.user;

import com.bidforge.app.user.dto.request.UpdateUserRequest;
import com.bidforge.app.user.dto.response.UserResponse;
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
        User user = getAuthenticatedUser();
        return mapToResponse(user);
    }

    public UserResponse updateCurrentUser(UpdateUserRequest request) {

        User user = getAuthenticatedUser();

        if (request.getName() != null) {
            user.setName(request.getName());
        }

        if (request.getProfileImageUrl() != null) {
            user.setProfileImageUrl(request.getProfileImageUrl());
        }

        User updated = userRepository.save(user);

        return mapToResponse(updated);
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
                .build();
    }
}