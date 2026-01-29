-- 1) Help ticket chat/messages table
CREATE TABLE IF NOT EXISTS public.help_ticket_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.help_tickets(id) ON DELETE CASCADE,
  sender_user_id uuid NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_help_ticket_messages_ticket_id_created_at
  ON public.help_ticket_messages(ticket_id, created_at);

ALTER TABLE public.help_ticket_messages ENABLE ROW LEVEL SECURITY;

-- RLS: users/admins who can access ticket can read messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'help_ticket_messages'
      AND policyname = 'Ticket participants can view messages'
  ) THEN
    CREATE POLICY "Ticket participants can view messages"
    ON public.help_ticket_messages
    FOR SELECT
    USING (public.can_access_ticket(auth.uid(), ticket_id));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'help_ticket_messages'
      AND policyname = 'Ticket participants can send messages'
  ) THEN
    CREATE POLICY "Ticket participants can send messages"
    ON public.help_ticket_messages
    FOR INSERT
    WITH CHECK (
      sender_user_id = auth.uid()
      AND public.can_access_ticket(auth.uid(), ticket_id)
    );
  END IF;
END $$;

-- 2) Admin reporting helpers
CREATE OR REPLACE FUNCTION public.admin_accessible_campuses()
RETURNS TABLE (id uuid, name text, city text, state text, country text)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT c.id, c.name, c.city, c.state, c.country
  FROM public.campuses c
  WHERE public.has_role(auth.uid(), 'super_admin')

  UNION ALL

  SELECT c.id, c.name, c.city, c.state, c.country
  FROM public.admin_campuses ac
  JOIN public.campuses c ON c.id = ac.campus_id
  WHERE NOT public.has_role(auth.uid(), 'super_admin')
    AND ac.user_id = auth.uid();
$$;

CREATE OR REPLACE FUNCTION public.assert_admin_for_campus(_campus_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF NOT public.is_admin_for_campus(auth.uid(), _campus_id) THEN
    RAISE EXCEPTION 'Not authorized for campus';
  END IF;
END;
$$;

-- 3) Summary RPC
CREATE OR REPLACE FUNCTION public.admin_dashboard_summary(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS json
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_help_total bigint;
  v_help_open bigint;
  v_help_ack bigint;
  v_help_resolved bigint;
  v_travel_created bigint;
  v_travel_active bigint;
  v_errands_created bigint;
  v_errands_active bigint;
  v_carpool_requests bigint;
  v_errand_requests bigint;
BEGIN
  PERFORM public.assert_admin_for_campus(_campus_id);

  SELECT count(*)
    INTO v_help_total
  FROM public.help_tickets t
  WHERE t.campus_id = _campus_id
    AND t.created_at >= _from AND t.created_at <= _to;

  SELECT count(*) INTO v_help_open
  FROM public.help_tickets t
  WHERE t.campus_id = _campus_id
    AND t.created_at >= _from AND t.created_at <= _to
    AND t.status = 'open';

  SELECT count(*) INTO v_help_ack
  FROM public.help_tickets t
  WHERE t.campus_id = _campus_id
    AND t.created_at >= _from AND t.created_at <= _to
    AND t.status = 'acknowledged';

  SELECT count(*) INTO v_help_resolved
  FROM public.help_tickets t
  WHERE t.campus_id = _campus_id
    AND t.created_at >= _from AND t.created_at <= _to
    AND t.status = 'resolved';

  SELECT count(*) INTO v_travel_created
  FROM public.travel_posts tp
  WHERE tp.campus_id = _campus_id
    AND tp.created_at >= _from AND tp.created_at <= _to;

  SELECT count(*) INTO v_travel_active
  FROM public.travel_posts tp
  WHERE tp.campus_id = _campus_id
    AND tp.status = 'active';

  SELECT count(*) INTO v_errands_created
  FROM public.errands e
  WHERE e.campus_id = _campus_id
    AND e.created_at >= _from AND e.created_at <= _to;

  SELECT count(*) INTO v_errands_active
  FROM public.errands e
  WHERE e.campus_id = _campus_id
    AND e.status = 'active';

  SELECT count(*) INTO v_carpool_requests
  FROM public.carpool_requests cr
  JOIN public.travel_posts tp ON tp.id = cr.travel_post_id
  WHERE tp.campus_id = _campus_id
    AND cr.created_at >= _from AND cr.created_at <= _to;

  SELECT count(*) INTO v_errand_requests
  FROM public.contact_requests r
  JOIN public.errands e ON e.id = r.entity_id
  WHERE r.entity_type = 'errand'
    AND e.campus_id = _campus_id
    AND r.created_at >= _from AND r.created_at <= _to;

  RETURN json_build_object(
    'help', json_build_object(
      'total', v_help_total,
      'open', v_help_open,
      'acknowledged', v_help_ack,
      'resolved', v_help_resolved
    ),
    'carpooling', json_build_object(
      'travel_posts_created', v_travel_created,
      'travel_posts_active', v_travel_active,
      'carpool_requests', v_carpool_requests
    ),
    'errands', json_build_object(
      'errands_created', v_errands_created,
      'errands_active', v_errands_active,
      'errand_requests', v_errand_requests
    )
  );
END;
$$;

-- 4) Export RPCs (returning row sets)
CREATE OR REPLACE FUNCTION public.admin_export_help_tickets(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  ticket_id uuid,
  created_at timestamptz,
  category text,
  urgency text,
  status text,
  requester_user_id uuid,
  requester_name text,
  requester_email text,
  acknowledged_by uuid,
  resolved_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    t.id AS ticket_id,
    t.created_at,
    t.category::text,
    t.urgency::text,
    t.status::text,
    t.requester_user_id,
    p.full_name AS requester_name,
    p.email AS requester_email,
    t.acknowledged_by,
    t.resolved_at
  FROM public.help_tickets t
  LEFT JOIN public.profiles p ON p.user_id = t.requester_user_id
  WHERE (public.assert_admin_for_campus(_campus_id) IS NULL)
    AND t.campus_id = _campus_id
    AND t.created_at >= _from AND t.created_at <= _to
  ORDER BY t.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_export_travel_posts(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  travel_post_id uuid,
  created_at timestamptz,
  from_location text,
  to_location text,
  departure_date date,
  departure_time time,
  total_seats int,
  available_seats int,
  price_cents int,
  status text,
  driver_profile_id uuid,
  driver_name text,
  driver_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    tp.id AS travel_post_id,
    tp.created_at,
    tp.from_location,
    tp.to_location,
    tp.departure_date,
    tp.departure_time,
    tp.total_seats,
    tp.available_seats,
    tp.price_cents,
    tp.status,
    d.id AS driver_profile_id,
    d.full_name AS driver_name,
    d.email AS driver_email
  FROM public.travel_posts tp
  LEFT JOIN public.profiles d ON d.id = tp.driver_id
  WHERE (public.assert_admin_for_campus(_campus_id) IS NULL)
    AND tp.campus_id = _campus_id
    AND tp.created_at >= _from AND tp.created_at <= _to
  ORDER BY tp.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_export_errands(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  errand_id uuid,
  created_at timestamptz,
  title text,
  status text,
  expires_at timestamptz,
  price_cents int,
  requester_profile_id uuid,
  requester_name text,
  requester_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    e.id AS errand_id,
    e.created_at,
    e.title,
    e.status,
    e.expires_at,
    e.price_cents,
    p.id AS requester_profile_id,
    p.full_name AS requester_name,
    p.email AS requester_email
  FROM public.errands e
  LEFT JOIN public.profiles p ON p.id = e.requester_profile_id
  WHERE (public.assert_admin_for_campus(_campus_id) IS NULL)
    AND e.campus_id = _campus_id
    AND e.created_at >= _from AND e.created_at <= _to
  ORDER BY e.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_export_carpool_requests(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  request_id uuid,
  created_at timestamptz,
  status text,
  message text,
  travel_post_id uuid,
  driver_profile_id uuid,
  driver_name text,
  driver_email text,
  passenger_profile_id uuid,
  passenger_name text,
  passenger_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    cr.id AS request_id,
    cr.created_at,
    cr.status,
    cr.message,
    cr.travel_post_id,
    d.id AS driver_profile_id,
    d.full_name AS driver_name,
    d.email AS driver_email,
    pa.id AS passenger_profile_id,
    pa.full_name AS passenger_name,
    pa.email AS passenger_email
  FROM public.carpool_requests cr
  JOIN public.travel_posts tp ON tp.id = cr.travel_post_id
  LEFT JOIN public.profiles d ON d.id = tp.driver_id
  LEFT JOIN public.profiles pa ON pa.id = cr.passenger_id
  WHERE (public.assert_admin_for_campus(_campus_id) IS NULL)
    AND tp.campus_id = _campus_id
    AND cr.created_at >= _from AND cr.created_at <= _to
  ORDER BY cr.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_export_errand_requests(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  request_id uuid,
  created_at timestamptz,
  status text,
  message text,
  errand_id uuid,
  owner_profile_id uuid,
  owner_name text,
  owner_email text,
  requester_profile_id uuid,
  requester_name text,
  requester_email text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    r.id AS request_id,
    r.created_at,
    r.status,
    r.message,
    e.id AS errand_id,
    o.id AS owner_profile_id,
    o.full_name AS owner_name,
    o.email AS owner_email,
    q.id AS requester_profile_id,
    q.full_name AS requester_name,
    q.email AS requester_email
  FROM public.contact_requests r
  JOIN public.errands e ON e.id = r.entity_id
  LEFT JOIN public.profiles o ON o.id = r.owner_profile_id
  LEFT JOIN public.profiles q ON q.id = r.requester_profile_id
  WHERE (public.assert_admin_for_campus(_campus_id) IS NULL)
    AND r.entity_type = 'errand'
    AND e.campus_id = _campus_id
    AND r.created_at >= _from AND r.created_at <= _to
  ORDER BY r.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_export_help_ticket_messages(
  _campus_id uuid,
  _from timestamptz,
  _to timestamptz
)
RETURNS TABLE (
  message_id uuid,
  created_at timestamptz,
  ticket_id uuid,
  sender_user_id uuid,
  sender_name text,
  sender_email text,
  message text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    m.id AS message_id,
    m.created_at,
    m.ticket_id,
    m.sender_user_id,
    p.full_name AS sender_name,
    p.email AS sender_email,
    m.message
  FROM public.help_ticket_messages m
  JOIN public.help_tickets t ON t.id = m.ticket_id
  LEFT JOIN public.profiles p ON p.user_id = m.sender_user_id
  WHERE (public.assert_admin_for_campus(_campus_id) IS NULL)
    AND t.campus_id = _campus_id
    AND m.created_at >= _from AND m.created_at <= _to
  ORDER BY m.created_at DESC;
$$;
