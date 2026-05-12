package com.bidforge.app.notification.preferences;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class NotificationPreferenceDto {
    @Builder.Default private boolean jobCreated = true;
    @Builder.Default private boolean jobInvited = true;
    @Builder.Default private boolean bidPlaced = true;
    @Builder.Default private boolean bidAccepted = true;
    @Builder.Default private boolean bidRejected = true;
    @Builder.Default private boolean contractCreated = true;
    @Builder.Default private boolean contractSubmitted = true;
    @Builder.Default private boolean contractCompleted = true;
    @Builder.Default private boolean revisionRequested = true;
    @Builder.Default private boolean milestoneCreated = true;
    @Builder.Default private boolean milestoneFunded = true;
    @Builder.Default private boolean milestoneSubmitted = true;
    @Builder.Default private boolean milestoneApproved = true;
    @Builder.Default private boolean milestoneRejected = true;
    @Builder.Default private boolean milestoneRefunded = true;
    @Builder.Default private boolean paymentReleased = true;
    @Builder.Default private boolean reviewReceived = true;
    @Builder.Default private boolean disputeOpened = true;
    @Builder.Default private boolean userBanned = true;
    @Builder.Default private boolean newUserRegistered = true;
}
