package com.bidforge.app.job_invite.dto;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.util.UUID;

@Getter
@Setter
@Builder
public class InvitedJobResponse {

    private UUID jobId;
    private String title;
    private String category;
    private Double budgetMin;
    private Double budgetMax;
}
