-- A2) Backend safety: force correct campus_id on insert

-- Helper function: enforce campus_id from current user profile
CREATE OR REPLACE FUNCTION public.force_row_campus_id()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_campus_id uuid;
BEGIN
  v_campus_id := public.current_user_campus_id();

  IF v_campus_id IS NULL THEN
    RAISE EXCEPTION 'Profile campus_id is not set for current user';
  END IF;

  NEW.campus_id := v_campus_id;
  RETURN NEW;
END;
$$;

-- group_orders
DROP TRIGGER IF EXISTS trg_force_group_orders_campus_id ON public.group_orders;
CREATE TRIGGER trg_force_group_orders_campus_id
BEFORE INSERT ON public.group_orders
FOR EACH ROW
EXECUTE FUNCTION public.force_row_campus_id();

-- help_tickets
DROP TRIGGER IF EXISTS trg_force_help_tickets_campus_id ON public.help_tickets;
CREATE TRIGGER trg_force_help_tickets_campus_id
BEFORE INSERT ON public.help_tickets
FOR EACH ROW
EXECUTE FUNCTION public.force_row_campus_id();


-- C3) Prevent spam duplicates: only one pending request per requester per entity
CREATE UNIQUE INDEX IF NOT EXISTS contact_requests_unique_pending
ON public.contact_requests (entity_type, entity_id, requester_profile_id)
WHERE status = 'pending';
