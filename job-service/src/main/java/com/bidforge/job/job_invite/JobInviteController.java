package com.bidforge.job.job_invite;

import com.bidforge.job.auth.UserInfo;
import com.bidforge.job.job.dto.response.JobResponse;
import com.bidforge.job.job_invite.dto.InviteRequest;
import com.bidforge.job.job_invite.dto.InviteWithJobResponse;
import com.bidforge.job.job_invite.dto.JobInviteStatusResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/jobs")
@RequiredArgsConstructor
public class JobInviteController {

    private final JobInviteService jobInviteService;

    private UserInfo getCurrentUser() {
        return (UserInfo) SecurityContextHolder.getContext().getAuthentication().getPrincipal();
    }

    @PostMapping("/{jobId}/invite")
    @PreAuthorize("hasRole('CLIENT')")
    public ResponseEntity<String> inviteFreelancers(
            @PathVariable UUID jobId,
            @RequestBody InviteRequest request
    ) {
        jobInviteService.inviteFreelancers(jobId, request.getFreelancerIds(), getCurrentUser());
        return ResponseEntity.status(HttpStatus.CREATED).body("Invitations sent");
    }

    @PostMapping("/invites/{inviteId}/accept")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<String> acceptInvite(@PathVariable UUID inviteId) {
        jobInviteService.acceptInvite(inviteId, getCurrentUser());
        return ResponseEntity.ok("Invite accepted");
    }

    @PostMapping("/invites/{inviteId}/decline")
    @PreAuthorize("hasRole('FREELANCER')")
    public ResponseEntity<String> declineInvite(@PathVariable UUID inviteId) {
        jobInviteService.declineInvite(inviteId, getCurrentUser());
        return ResponseEntity.ok("Invite declined");
    }

    @GetMapping("/invited")
    @PreAuthorize("hasRole('FREELANCER')")
    public List<JobResponse> getMyInvites() {
        return jobInviteService.getMyInvites(getCurrentUser());
    }

    @GetMapping("/invites")
    @PreAuthorize("hasRole('FREELANCER')")
    public List<InviteWithJobResponse> getMyInvitesWithStatus() {
        return jobInviteService.getMyInvitesWithStatus(getCurrentUser());
    }

    @GetMapping("/{jobId}/invites")
    @PreAuthorize("hasRole('CLIENT')")
    public List<JobInviteStatusResponse> getJobInvites(@PathVariable UUID jobId) {
        return jobInviteService.getJobInvites(jobId, getCurrentUser());
    }

    @GetMapping("/all-invites")
    @PreAuthorize("hasRole('CLIENT')")
    public List<JobInviteStatusResponse> getAllClientInvites() {
        return jobInviteService.getAllClientInvites(getCurrentUser());
    }
}
