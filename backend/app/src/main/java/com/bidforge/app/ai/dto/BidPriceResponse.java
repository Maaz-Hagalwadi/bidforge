package com.bidforge.app.ai.dto;

import lombok.Data;

@Data
public class BidPriceResponse {
    private double lowBid;
    private double competitiveBid;
    private double premiumBid;
    private String reasoning;
}
