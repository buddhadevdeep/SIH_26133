export interface HealthNotification {
  id: string;
  recipientRole?: string;
  recipientUserId?: string;
  recipientFacilityId?: string;
  title: string;
  message: string;
  type: 'REFERRAL' | 'APPOINTMENT' | 'QUEUE' | 'CLINICAL' | 'SYSTEM' | 'LEAVE' | 'STAFF';
  referralId?: string;
  referralCode?: string;
  leaveId?: string;
  read: boolean;
  timestamp: string;
}
