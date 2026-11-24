package com.bidforge.notification.preferences;

import com.bidforge.notification.notification.NotificationType;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationPreferenceService {

    private final NotificationPreferenceRepository repository;

    public NotificationPreferenceDto getOrCreate(Long userId) {
        return toDto(repository.findByUserId(userId)
                .orElseGet(() -> repository.save(
                        NotificationPreference.builder().userId(userId).build())));
    }

    @Transactional
    public NotificationPreferenceDto update(Long userId, NotificationPreferenceDto dto) {
        NotificationPreference pref = repository.findByUserId(userId)
                .orElseGet(() -> NotificationPreference.builder().userId(userId).build());
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
        pref.setDisputeOpened(dto.isDisputeOpened());
        pref.setDisputeResolved(dto.isDisputeResolved());
        pref.setUserBanned(dto.isUserBanned());
        pref.setNewUserRegistered(dto.isNewUserRegistered());
        return toDto(repository.save(pref));
    }

    public boolean isEnabled(Long userId, NotificationType type) {
        return repository.findByUserId(userId)
                .map(p -> switch (type) {
                    case JOB_CREATED         -> p.isJobCreated();
                    case JOB_INVITED         -> p.isJobInvited();
                    case BID_PLACED          -> p.isBidPlaced();
                    case BID_ACCEPTED        -> p.isBidAccepted();
                    case BID_REJECTED        -> p.isBidRejected();
                    case CONTRACT_CREATED    -> p.isContractCreated();
                    case CONTRACT_SUBMITTED  -> p.isContractSubmitted();
                    case CONTRACT_COMPLETED  -> p.isContractCompleted();
                    case REVISION_REQUESTED  -> p.isRevisionRequested();
                    case MILESTONE_CREATED   -> p.isMilestoneCreated();
                    case MILESTONE_FUNDED    -> p.isMilestoneFunded();
                    case MILESTONE_SUBMITTED -> p.isMilestoneSubmitted();
                    case MILESTONE_APPROVED  -> p.isMilestoneApproved();
                    case MILESTONE_REJECTED  -> p.isMilestoneRejected();
                    case MILESTONE_REFUNDED  -> p.isMilestoneRefunded();
                    case PAYMENT_RELEASED    -> p.isPaymentReleased();
                    case REVIEW_RECEIVED     -> p.isReviewReceived();
                    case DISPUTE_OPENED      -> p.isDisputeOpened();
                    case DISPUTE_RESOLVED    -> p.isDisputeResolved();
                    case USER_BANNED         -> p.isUserBanned();
                    case NEW_USER_REGISTERED -> p.isNewUserRegistered();
                })
                .orElse(true);
    }

    private NotificationPreferenceDto toDto(NotificationPreference p) {
        return NotificationPreferenceDto.builder()
                .jobCreated(p.isJobCreated()).jobInvited(p.isJobInvited())
                .bidPlaced(p.isBidPlaced()).bidAccepted(p.isBidAccepted()).bidRejected(p.isBidRejected())
                .contractCreated(p.isContractCreated()).contractSubmitted(p.isContractSubmitted())
                .contractCompleted(p.isContractCompleted()).revisionRequested(p.isRevisionRequested())
                .milestoneCreated(p.isMilestoneCreated()).milestoneFunded(p.isMilestoneFunded())
                .milestoneSubmitted(p.isMilestoneSubmitted()).milestoneApproved(p.isMilestoneApproved())
                .milestoneRejected(p.isMilestoneRejected()).milestoneRefunded(p.isMilestoneRefunded())
                .paymentReleased(p.isPaymentReleased()).reviewReceived(p.isReviewReceived())
                .disputeOpened(p.isDisputeOpened()).disputeResolved(p.isDisputeResolved())
                .userBanned(p.isUserBanned()).newUserRegistered(p.isNewUserRegistered())
                .build();
    }
}
