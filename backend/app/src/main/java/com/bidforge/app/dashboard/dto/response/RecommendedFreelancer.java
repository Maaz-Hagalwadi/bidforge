package com.bidforge.app.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class RecommendedFreelancer {

    private String name;
    private String title;
    private double rating;
    private int reviewsCount;
}