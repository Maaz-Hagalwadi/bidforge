package com.bidforge.app.job_invite.dto;

import com.bidforge.app.job_invite.InviteStatus;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;
import java.util.UUID;

@Getter
@Builder
public class JobInviteStatusResponse {
    private UUID inviteId;
    private UUID jobId;
    private String jobTitle;
    private Long freelancerId;
    private String freelancerName;
    private String freelancerEmail;
    private InviteStatus status;
    private LocalDateTime invitedAt;
}
