-- 1) Enums
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('super_admin', 'admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.help_ticket_category AS ENUM ('medical', 'safety', 'mental_health', 'lost_item', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.help_ticket_urgency AS ENUM ('low', 'medium', 'high', 'critical');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.help_ticket_status AS ENUM ('open', 'acknowledged', 'in_progress', 'resolved');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Roles table (separate from profiles/users)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3) Admin-to-campus mapping
CREATE TABLE IF NOT EXISTS public.admin_campuses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  campus_id uuid NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, campus_id)
);

ALTER TABLE public.admin_campuses ENABLE ROW LEVEL SECURITY;

-- 4) Tickets
CREATE TABLE IF NOT EXISTS public.help_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  requester_user_id uuid NOT NULL,
  campus_id uuid NOT NULL REFERENCES public.campuses(id),
  category public.help_ticket_category NOT NULL,
  urgency public.help_ticket_urgency NOT NULL,
  description text NOT NULL,
  status public.help_ticket_status NOT NULL DEFAULT 'open',
  acknowledged_by uuid NULL,
  resolved_at timestamptz NULL
);

ALTER TABLE public.help_tickets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_help_tickets_campus_status_created
  ON public.help_tickets (campus_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_help_tickets_requester_created
  ON public.help_tickets (requester_user_id, created_at DESC);

-- 5) Ticket locations (1 hour expiry)
CREATE TABLE IF NOT EXISTS public.help_ticket_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id uuid NOT NULL REFERENCES public.help_tickets(id) ON DELETE CASCADE,
  lat numeric NOT NULL,
  lng numeric NOT NULL,
  captured_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 hour')
);

ALTER TABLE public.help_ticket_locations ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_help_ticket_locations_ticket_expires
  ON public.help_ticket_locations (ticket_id, expires_at DESC);

-- 6) Notifications deep-link to tickets
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS related_ticket_id uuid NULL;

DO $$ BEGIN
  ALTER TABLE public.notifications
    ADD CONSTRAINT notifications_related_ticket_id_fkey
    FOREIGN KEY (related_ticket_id)
    REFERENCES public.help_tickets(id)
    ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 7) Security definer helpers (avoid RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user_id AND ur.role = _role
  );
$$;

CREATE OR REPLACE FUNCTION public.current_user_campus_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.campus_id
  FROM public.profiles p
  WHERE p.user_id = auth.uid()
  LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin_for_campus(_user_id uuid, _campus_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.has_role(_user_id, 'super_admin')
    OR (
      public.has_role(_user_id, 'admin')
      AND EXISTS (
        SELECT 1
        FROM public.admin_campuses ac
        WHERE ac.user_id = _user_id
          AND ac.campus_id = _campus_id
      )
    );
$$;

CREATE OR REPLACE FUNCTION public.is_requester_for_ticket(_user_id uuid, _ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.help_tickets t
    WHERE t.id = _ticket_id
      AND t.requester_user_id = _user_id
  );
$$;

CREATE OR REPLACE FUNCTION public.can_access_ticket(_user_id uuid, _ticket_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.help_tickets t
    WHERE t.id = _ticket_id
      AND (
        t.requester_user_id = _user_id
        OR public.is_admin_for_campus(_user_id, t.campus_id)
      )
  );
$$;

-- 8) Validation trigger for locations (no CHECK with now())
CREATE OR REPLACE FUNCTION public.validate_help_ticket_location()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.expires_at <= NEW.captured_at THEN
    RAISE EXCEPTION 'expires_at must be after captured_at';
  END IF;
  IF NEW.expires_at <= now() THEN
    RAISE EXCEPTION 'expires_at must be in the future';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_help_ticket_location ON public.help_ticket_locations;
CREATE TRIGGER trg_validate_help_ticket_location
BEFORE INSERT OR UPDATE ON public.help_ticket_locations
FOR EACH ROW
EXECUTE FUNCTION public.validate_help_ticket_location();

-- 9) updated_at trigger for tickets
DROP TRIGGER IF EXISTS trg_help_tickets_updated_at ON public.help_tickets;
CREATE TRIGGER trg_help_tickets_updated_at
BEFORE UPDATE ON public.help_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 10) Notify campus admins (+ super admin) on new ticket
CREATE OR REPLACE FUNCTION public.notify_admins_on_help_ticket_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r record;
BEGIN
  FOR r IN (
    SELECT DISTINCT p.id AS profile_id
    FROM public.profiles p
    WHERE p.user_id IN (
      SELECT ur.user_id FROM public.user_roles ur WHERE ur.role = 'super_admin'
      UNION
      SELECT ac.user_id FROM public.admin_campuses ac WHERE ac.campus_id = NEW.campus_id
    )
  ) LOOP
    INSERT INTO public.notifications (user_id, type, title, message, related_ticket_id)
    VALUES (
      r.profile_id,
      'help_ticket',
      'New urgent help ticket',
      concat('Category: ', NEW.category::text, ' • Urgency: ', NEW.urgency::text),
      NEW.id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_admins_help_ticket_insert ON public.help_tickets;
CREATE TRIGGER trg_notify_admins_help_ticket_insert
AFTER INSERT ON public.help_tickets
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_help_ticket_insert();

-- 11) RLS policies
-- user_roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
ON public.user_roles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin can manage roles" ON public.user_roles;
CREATE POLICY "Super admin can manage roles"
ON public.user_roles
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- admin_campuses
DROP POLICY IF EXISTS "Admins can view their own campus mappings" ON public.admin_campuses;
CREATE POLICY "Admins can view their own campus mappings"
ON public.admin_campuses
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super admin can manage admin campuses" ON public.admin_campuses;
CREATE POLICY "Super admin can manage admin campuses"
ON public.admin_campuses
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- help_tickets
DROP POLICY IF EXISTS "Requester can create own tickets" ON public.help_tickets;
CREATE POLICY "Requester can create own tickets"
ON public.help_tickets
FOR INSERT
TO authenticated
WITH CHECK (
  requester_user_id = auth.uid()
  AND campus_id = public.current_user_campus_id()
  AND public.current_user_campus_id() IS NOT NULL
);

DROP POLICY IF EXISTS "Requester can view own tickets" ON public.help_tickets;
CREATE POLICY "Requester can view own tickets"
ON public.help_tickets
FOR SELECT
TO authenticated
USING (
  requester_user_id = auth.uid()
  OR public.is_admin_for_campus(auth.uid(), campus_id)
);

DROP POLICY IF EXISTS "Admins can update campus tickets" ON public.help_tickets;
CREATE POLICY "Admins can update campus tickets"
ON public.help_tickets
FOR UPDATE
TO authenticated
USING (public.is_admin_for_campus(auth.uid(), campus_id))
WITH CHECK (public.is_admin_for_campus(auth.uid(), campus_id));

-- help_ticket_locations
DROP POLICY IF EXISTS "Requester can insert ticket locations" ON public.help_ticket_locations;
CREATE POLICY "Requester can insert ticket locations"
ON public.help_ticket_locations
FOR INSERT
TO authenticated
WITH CHECK (public.is_requester_for_ticket(auth.uid(), ticket_id));

DROP POLICY IF EXISTS "Authorized users can view ticket locations" ON public.help_ticket_locations;
CREATE POLICY "Authorized users can view ticket locations"
ON public.help_ticket_locations
FOR SELECT
TO authenticated
USING (public.can_access_ticket(auth.uid(), ticket_id));
