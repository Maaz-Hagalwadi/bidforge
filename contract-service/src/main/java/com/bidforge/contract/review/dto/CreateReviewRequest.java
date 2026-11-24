package com.bidforge.contract.review.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateReviewRequest {
    private int rating;
    private String comment;
}
