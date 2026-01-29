-- Add additional metadata + auto-expiry to group_orders
ALTER TABLE public.group_orders
  ADD COLUMN IF NOT EXISTS restaurant_name text,
  ADD COLUMN IF NOT EXISTS order_for_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '24 hours');

CREATE INDEX IF NOT EXISTS idx_group_orders_expires_at ON public.group_orders (expires_at);

-- Contact requests table for in-app connection requests (group orders, errands, etc.)
CREATE TABLE IF NOT EXISTS public.contact_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  requester_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_contact_requests_entity_requester
  ON public.contact_requests (entity_type, entity_id, requester_profile_id);

CREATE INDEX IF NOT EXISTS idx_contact_requests_owner_status
  ON public.contact_requests (owner_profile_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_contact_requests_requester_status
  ON public.contact_requests (requester_profile_id, status, created_at DESC);

ALTER TABLE public.contact_requests ENABLE ROW LEVEL SECURITY;

-- Policies: requester or owner can view
DO $$ BEGIN
  CREATE POLICY "Contact requests are viewable by requester or owner"
  ON public.contact_requests
  FOR SELECT
  USING (
    requester_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
    OR owner_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Requester can create requests as themselves
DO $$ BEGIN
  CREATE POLICY "Users can create contact requests"
  ON public.contact_requests
  FOR INSERT
  WITH CHECK (
    requester_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Requester can update their own pending request message
DO $$ BEGIN
  CREATE POLICY "Requesters can update their pending requests"
  ON public.contact_requests
  FOR UPDATE
  USING (
    requester_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    requester_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Owners can update status (approve/decline)
DO $$ BEGIN
  CREATE POLICY "Owners can update requests to them"
  ON public.contact_requests
  FOR UPDATE
  USING (
    owner_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  )
  WITH CHECK (
    owner_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Requester can delete their request
DO $$ BEGIN
  CREATE POLICY "Requesters can delete their requests"
  ON public.contact_requests
  FOR DELETE
  USING (
    requester_profile_id IN (
      SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid()
    )
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Keep updated_at current
DO $$ BEGIN
  CREATE TRIGGER update_contact_requests_updated_at
  BEFORE UPDATE ON public.contact_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;