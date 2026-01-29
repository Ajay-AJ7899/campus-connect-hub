export type ErrandStatus = "active" | "expired" | string;

export type ErrandRow = {
  id: string;
  created_at: string;
  updated_at: string;
  requester_profile_id: string;
  campus_id: string | null;
  title: string;
  description: string;
  status: ErrandStatus;
  expires_at: string;
};

export type ErrandPhotoRow = {
  id: string;
  created_at: string;
  errand_id: string;
  path: string;
  sort_order: number;
};
