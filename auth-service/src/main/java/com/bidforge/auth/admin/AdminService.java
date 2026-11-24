package com.bidforge.auth.admin;

import com.bidforge.auth.common.exception.UserNotFoundException;
import com.bidforge.auth.login_activity.LoginActivity;
import com.bidforge.auth.login_activity.LoginActivityRepository;
import com.bidforge.auth.user.Role;
import com.bidforge.auth.user.User;
import com.bidforge.auth.user.UserRepository;
import com.bidforge.auth.user.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@RequiredArgsConstructor
public class AdminService {

    private final UserRepository userRepository;
    private final LoginActivityRepository loginActivityRepository;

    public Page<UserResponse> searchUsers(String q, int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        String query = q == null ? "" : q;
        return userRepository
                .findByNameContainingIgnoreCaseOrEmailContainingIgnoreCase(query, query, pageable)
                .map(this::mapToResponse);
    }

    public void banUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setBanned(true);
        userRepository.save(user);
    }

    public void unbanUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        user.setBanned(false);
        userRepository.save(user);
    }

    public void deleteUser(Long id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new UserNotFoundException("User not found"));
        userRepository.delete(user);
    }

    public Page<LoginActivity> getLoginActivity(int page, int size) {
        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        return loginActivityRepository.findAll(pageable);
    }

    public Map<String, Long> getStats() {
        long totalUsers = userRepository.count();
        long totalClients = userRepository.findByRole(Role.CLIENT).size();
        long totalFreelancers = userRepository.findByRole(Role.FREELANCER).size();
        long bannedUsers = userRepository.findAll().stream()
                .filter(User::isBanned)
                .count();
        return Map.of(
                "totalUsers", totalUsers,
                "totalClients", totalClients,
                "totalFreelancers", totalFreelancers,
                "bannedUsers", bannedUsers
        );
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
