export type NotificationType =
  | 'JOB_CREATED'
  | 'JOB_INVITED'
  | 'BID_PLACED'
  | 'BID_ACCEPTED'
  | 'BID_REJECTED'
  | 'CONTRACT_CREATED'
  | 'CONTRACT_SUBMITTED'
  | 'CONTRACT_COMPLETED'
  | 'REVISION_REQUESTED'
  | 'MILESTONE_CREATED'
  | 'MILESTONE_FUNDED'
  | 'MILESTONE_SUBMITTED'
  | 'MILESTONE_APPROVED'
  | 'MILESTONE_REJECTED'
  | 'MILESTONE_REFUNDED'
  | 'PAYMENT_RELEASED';

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  referenceId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationToast {
  toastId: string;
  notification: AppNotification;
}
