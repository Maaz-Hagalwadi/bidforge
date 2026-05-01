package com.bidforge.app.user.dto.response;

import com.bidforge.app.user.Role;
import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserResponse {

    private Long id;
    private String name;
    private String email;
    private String phoneNumber;
    private Role role;
    private Double rating;
    private String profileImageUrl;
    private String title;
    private String bio;
    private String location;
    private Double hourlyRate;
    private String skills;
    private LocalDateTime createdAt;
}