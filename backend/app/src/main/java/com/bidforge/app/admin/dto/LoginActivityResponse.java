package com.bidforge.app.admin.dto;

import com.bidforge.app.login_activity.LoginActivity;

import java.time.LocalDateTime;

public record LoginActivityResponse(
        Long id,
        Long userId,
        String userName,
        String userEmail,
        String role,
        String ipAddress,
        String city,
        String country,
        String countryCode,
        String userAgent,
        String loginMethod,
        LocalDateTime createdAt
) {
    public static LoginActivityResponse from(LoginActivity a) {
        return new LoginActivityResponse(
                a.getId(),
                a.getUser().getId(),
                a.getUser().getName(),
                a.getUser().getEmail(),
                a.getUser().getRole().name(),
                a.getIpAddress(),
                a.getCity(),
                a.getCountry(),
                a.getCountryCode(),
                a.getUserAgent(),
                a.getLoginMethod(),
                a.getCreatedAt()
        );
    }
}
