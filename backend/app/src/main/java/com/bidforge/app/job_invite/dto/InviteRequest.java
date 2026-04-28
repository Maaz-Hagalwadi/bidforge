package com.bidforge.app.job_invite.dto;

import lombok.*;

import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class InviteRequest {
    private List<Long> freelancerIds;
}