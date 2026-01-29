export type GroupOrderStatus = "active" | "closed" | string;

export type GroupOrderRow = {
  id: string;
  created_at: string;
  updated_at: string;
  creator_profile_id: string;
  campus_id: string;
  title: string;
  description: string;
  deadline_at: string | null;
  status: GroupOrderStatus;
};

export type GroupOrderParticipantRow = {
  id: string;
  created_at: string;
  order_id: string;
  participant_profile_id: string;
  quantity: number;
  note: string | null;
};
