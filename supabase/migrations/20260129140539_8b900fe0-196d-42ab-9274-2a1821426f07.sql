-- 1) Enforce single-university per admin
DO $$ BEGIN
  ALTER TABLE public.admin_campuses
    ADD CONSTRAINT admin_campuses_one_campus_per_admin UNIQUE (user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Allow super admin to manage campuses (approve requests creates campus)
DO $$ BEGIN
  ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;
EXCEPTION WHEN others THEN NULL; END $$;

DROP POLICY IF EXISTS "Super admin can insert campuses" ON public.campuses;
CREATE POLICY "Super admin can insert campuses"
ON public.campuses
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admin can update campuses" ON public.campuses;
CREATE POLICY "Super admin can update campuses"
ON public.campuses
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 3) University (campus) requests by users
CREATE TABLE IF NOT EXISTS public.campus_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  requester_user_id uuid NOT NULL,
  name text NOT NULL,
  city text NOT NULL,
  state text NULL,
  country text NOT NULL DEFAULT 'USA',
  status text NOT NULL DEFAULT 'pending',
  reviewed_by uuid NULL,
  reviewed_at timestamptz NULL,
  review_notes text NULL,
  created_campus_id uuid NULL REFERENCES public.campuses(id) ON DELETE SET NULL
);

ALTER TABLE public.campus_requests ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_campus_requests_updated_at ON public.campus_requests;
CREATE TRIGGER trg_campus_requests_updated_at
BEFORE UPDATE ON public.campus_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- RLS: requester can create + view their own requests
DROP POLICY IF EXISTS "Users can create campus requests" ON public.campus_requests;
CREATE POLICY "Users can create campus requests"
ON public.campus_requests
FOR INSERT
TO authenticated
WITH CHECK (requester_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can view their own campus requests" ON public.campus_requests;
CREATE POLICY "Users can view their own campus requests"
ON public.campus_requests
FOR SELECT
TO authenticated
USING (requester_user_id = auth.uid() OR public.has_role(auth.uid(), 'super_admin'));

DROP POLICY IF EXISTS "Super admin can update campus requests" ON public.campus_requests;
CREATE POLICY "Super admin can update campus requests"
ON public.campus_requests
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- 4) Invite codes for admins (redeemable by users)
CREATE TABLE IF NOT EXISTS public.admin_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid NOT NULL,
  campus_id uuid NOT NULL REFERENCES public.campuses(id) ON DELETE CASCADE,
  code text NOT NULL,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '7 days'),
  used_by uuid NULL,
  used_at timestamptz NULL,
  UNIQUE (code)
);

ALTER TABLE public.admin_invites ENABLE ROW LEVEL SECURITY;

-- Only super admin can view/manage invites
DROP POLICY IF EXISTS "Super admin can manage admin invites" ON public.admin_invites;
CREATE POLICY "Super admin can manage admin invites"
ON public.admin_invites
FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'super_admin'))
WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

-- Helper: redeem invite (SECURITY DEFINER) so normal user can claim without direct table access
CREATE OR REPLACE FUNCTION public.redeem_admin_invite(_code text)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_invite public.admin_invites%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO v_invite
  FROM public.admin_invites
  WHERE code = _code
  LIMIT 1;

  IF v_invite.id IS NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Invalid code');
  END IF;

  IF v_invite.used_at IS NOT NULL THEN
    RETURN json_build_object('ok', false, 'error', 'Code already used');
  END IF;

  IF v_invite.expires_at <= now() THEN
    RETURN json_build_object('ok', false, 'error', 'Code expired');
  END IF;

  -- Grant admin role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (auth.uid(), 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Single-university assignment (enforced by unique constraint)
  INSERT INTO public.admin_campuses (user_id, campus_id)
  VALUES (auth.uid(), v_invite.campus_id)
  ON CONFLICT (user_id) DO UPDATE SET campus_id = EXCLUDED.campus_id;

  -- Mark invite used
  UPDATE public.admin_invites
  SET used_by = auth.uid(), used_at = now()
  WHERE id = v_invite.id;

  RETURN json_build_object('ok', true, 'campus_id', v_invite.campus_id);
END;
$$;

-- Allow authenticated users to call redeem_admin_invite
REVOKE ALL ON FUNCTION public.redeem_admin_invite(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.redeem_admin_invite(text) TO authenticated;
