package com.bidforge.auth.user.portfolio.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PortfolioRequest {

    @NotBlank
    private String title;

    private String description;
    private String imageUrl;
    private String projectUrl;
}
