package com.bidforge.app.user.dto.response;

import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter @Builder
public class PortfolioResponse {
    private UUID id;
    private String title;
    private String description;
    private String imageUrl;
    private String projectUrl;
    private String technologies;
    private LocalDateTime createdAt;
}