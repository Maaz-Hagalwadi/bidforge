export interface NotificationPreferenceDto {
  jobCreated: boolean;
  jobInvited: boolean;
  bidPlaced: boolean;
  bidAccepted: boolean;
  bidRejected: boolean;
  contractCreated: boolean;
  contractSubmitted: boolean;
  contractCompleted: boolean;
  revisionRequested: boolean;
  milestoneCreated: boolean;
  milestoneFunded: boolean;
  milestoneSubmitted: boolean;
  milestoneApproved: boolean;
  milestoneRejected: boolean;
  milestoneRefunded: boolean;
  paymentReleased: boolean;
  reviewReceived: boolean;
}

export const DEFAULT_PREFERENCES: NotificationPreferenceDto = {
  jobCreated: true, jobInvited: true,
  bidPlaced: true, bidAccepted: true, bidRejected: true,
  contractCreated: true, contractSubmitted: true, contractCompleted: true, revisionRequested: true,
  milestoneCreated: true, milestoneFunded: true, milestoneSubmitted: true,
  milestoneApproved: true, milestoneRejected: true, milestoneRefunded: true,
  paymentReleased: true,
  reviewReceived: true,
};
