package com.bidforge.contract.dispute.dto;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class OpenDisputeRequest {
    private String reason;
    private String description;
}
