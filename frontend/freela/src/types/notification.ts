export type NotificationType =
  | 'proposal_accepted'
  | 'proposal_rejected'
  | 'new_message'
  | 'payment_received'
  | 'job_invitation'
  | 'profile_view'
  | 'review_received'
  | 'deadline_reminder';

export type NotificationFilter = 'all' | 'unread' | 'proposals' | 'messages' | 'payments';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  created_at: string; // ISO 8601 — padrão Django REST Framework
  read: boolean;
  metadata?: {
    amount?: number;
    company?: string;
    job_title?: string;
    rating?: number;
    action_url?: string;
  };
}

export interface NotificationsResponse {
  results: Notification[];
  unread_count: number;
}
