package com.bidforge.app.bid.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateBidRequest {

    @NotNull
    private Double amount;

    @NotBlank
    private String proposal;

    @NotNull
    private Integer deliveryDays;
}
