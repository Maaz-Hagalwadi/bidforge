package com.bidforge.auth.user.portfolio.dto;

import lombok.*;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioResponse {

    private Long id;
    private Long userId;
    private String title;
    private String description;
    private String imageUrl;
    private String projectUrl;
    private LocalDateTime createdAt;
}
