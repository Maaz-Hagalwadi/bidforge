package com.bidforge.app.admin.dto;

import com.bidforge.app.user.User;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AdminUserResponse {
    private Long id;
    private String name;
    private String email;
    private String role;
    private boolean banned;
    private boolean emailVerified;
    private String profileImageUrl;
    private Double rating;
    private String title;
    private LocalDateTime createdAt;

    public static AdminUserResponse from(User user) {
        return AdminUserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .banned(user.isBanned())
                .emailVerified(user.isEmailVerified())
                .profileImageUrl(user.getProfileImageUrl())
                .rating(user.getRating())
                .title(user.getTitle())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
