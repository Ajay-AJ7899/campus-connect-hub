export type HelpTicketUrgency = "low" | "medium" | "high" | "critical" | string;
export type HelpTicketStatus = "open" | "acknowledged" | "in_progress" | "resolved" | string;
export type HelpTicketCategory = "medical" | "safety" | "mental_health" | "lost_item" | "other" | string;

export type HelpTicketRow = {
  id: string;
  created_at: string;
  updated_at: string;
  requester_user_id: string;
  campus_id: string;
  category: HelpTicketCategory;
  urgency: HelpTicketUrgency;
  status: HelpTicketStatus;
  description: string;
  resolved_at: string | null;
  acknowledged_by: string | null;
};
