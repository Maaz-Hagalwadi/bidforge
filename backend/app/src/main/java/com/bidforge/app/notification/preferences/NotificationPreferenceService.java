package com.bidforge.app.notification.preferences;

import com.bidforge.app.notification.NotificationType;
import com.bidforge.app.user.User;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository repository;

    public NotificationPreferenceDto getOrCreate(User user) {
        return toDto(repository.findByUserId(user.getId())
                .orElseGet(() -> repository.save(
                        NotificationPreference.builder().user(user).build())));
    }

    @Transactional
    public NotificationPreferenceDto update(User user, NotificationPreferenceDto dto) {
        NotificationPreference pref = repository.findByUserId(user.getId())
                .orElseGet(() -> NotificationPreference.builder().user(user).build());
        pref.setJobCreated(dto.isJobCreated());
        pref.setJobInvited(dto.isJobInvited());
        pref.setBidPlaced(dto.isBidPlaced());
        pref.setBidAccepted(dto.isBidAccepted());
        pref.setBidRejected(dto.isBidRejected());
        pref.setContractCreated(dto.isContractCreated());
        pref.setContractSubmitted(dto.isContractSubmitted());
        pref.setContractCompleted(dto.isContractCompleted());
        pref.setRevisionRequested(dto.isRevisionRequested());
        pref.setMilestoneCreated(dto.isMilestoneCreated());
        pref.setMilestoneFunded(dto.isMilestoneFunded());
        pref.setMilestoneSubmitted(dto.isMilestoneSubmitted());
        pref.setMilestoneApproved(dto.isMilestoneApproved());
        pref.setMilestoneRejected(dto.isMilestoneRejected());
        pref.setMilestoneRefunded(dto.isMilestoneRefunded());
        pref.setPaymentReleased(dto.isPaymentReleased());
        pref.setReviewReceived(dto.isReviewReceived());
        return toDto(repository.save(pref));
    }

    public boolean isEnabled(User user, NotificationType type) {
        return repository.findByUserId(user.getId())
                .map(p -> switch (type) {
                    case JOB_CREATED        -> p.isJobCreated();
                    case JOB_INVITED        -> p.isJobInvited();
                    case BID_PLACED         -> p.isBidPlaced();
                    case BID_ACCEPTED       -> p.isBidAccepted();
                    case BID_REJECTED       -> p.isBidRejected();
                    case CONTRACT_CREATED   -> p.isContractCreated();
                    case CONTRACT_SUBMITTED -> p.isContractSubmitted();
                    case CONTRACT_COMPLETED -> p.isContractCompleted();
                    case REVISION_REQUESTED -> p.isRevisionRequested();
                    case MILESTONE_CREATED  -> p.isMilestoneCreated();
                    case MILESTONE_FUNDED   -> p.isMilestoneFunded();
                    case MILESTONE_SUBMITTED-> p.isMilestoneSubmitted();
                    case MILESTONE_APPROVED -> p.isMilestoneApproved();
                    case MILESTONE_REJECTED -> p.isMilestoneRejected();
                    case MILESTONE_REFUNDED -> p.isMilestoneRefunded();
                    case PAYMENT_RELEASED   -> p.isPaymentReleased();
                    case REVIEW_RECEIVED    -> p.isReviewReceived();
                })
                .orElse(true); // fail-open: no row = all enabled
    }

    private NotificationPreferenceDto toDto(NotificationPreference p) {
        return NotificationPreferenceDto.builder()
                .jobCreated(p.isJobCreated())
                .jobInvited(p.isJobInvited())
                .bidPlaced(p.isBidPlaced())
                .bidAccepted(p.isBidAccepted())
                .bidRejected(p.isBidRejected())
                .contractCreated(p.isContractCreated())
                .contractSubmitted(p.isContractSubmitted())
                .contractCompleted(p.isContractCompleted())
                .revisionRequested(p.isRevisionRequested())
                .milestoneCreated(p.isMilestoneCreated())
                .milestoneFunded(p.isMilestoneFunded())
                .milestoneSubmitted(p.isMilestoneSubmitted())
                .milestoneApproved(p.isMilestoneApproved())
                .milestoneRejected(p.isMilestoneRejected())
                .milestoneRefunded(p.isMilestoneRefunded())
                .paymentReleased(p.isPaymentReleased())
                .reviewReceived(p.isReviewReceived())
                .build();
    }
}
