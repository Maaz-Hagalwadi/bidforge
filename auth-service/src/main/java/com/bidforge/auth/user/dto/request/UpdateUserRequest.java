package com.bidforge.auth.user.dto.request;

import lombok.Data;

@Data
public class UpdateUserRequest {
    private String name;
    private String profileImageUrl;
    private String title;
    private String bio;
    private String location;
    private Double hourlyRate;
    private String skills;
}
