package com.bidforge.app.dashboard.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class ClientRecentProject {

    private String title;
    private String status; // OPEN, ASSIGNED, COMPLETED

    private String description;
    private int bidsReceived;

    private String budget;
    private String postedTime;

    private String assignedTo;
    private int milestonesCompleted;
    private int totalMilestones;

    private String dueDate;
    private double totalValue;
    private boolean paidOut;
}
