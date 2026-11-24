package com.bidforge.contract.review.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Setter
@Builder
public class ReviewResponse {
    private UUID id;
    private UUID contractId;
    private String contractJobTitle;
    private Long reviewerId;
    private Long revieweeId;
    private String reviewerName;
    private String revieweeName;
    private int rating;
    private String comment;
    private LocalDateTime createdAt;
}
