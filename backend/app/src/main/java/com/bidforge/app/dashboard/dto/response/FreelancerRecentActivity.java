package com.bidforge.app.dashboard.dto.response;


import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class FreelancerRecentActivity {

    private String type; // BID, PAYMENT, REVIEW
    private String title;
    private String description;
    private String time;
}
