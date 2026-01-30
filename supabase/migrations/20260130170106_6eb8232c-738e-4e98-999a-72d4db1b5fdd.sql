-- Post-level group chat for carpooling + errands

-- 1) Table
CREATE TABLE IF NOT EXISTS public.post_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  sender_profile_id uuid NOT NULL,
  message text NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_post_messages_entity ON public.post_messages (entity_type, entity_id, created_at);
CREATE INDEX IF NOT EXISTS idx_post_messages_expires_at ON public.post_messages (expires_at);

-- 2) Helpers
CREATE OR REPLACE FUNCTION public.chat_expires_at(_entity_type text, _entity_id uuid)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_expires timestamptz;
  v_departure_date date;
  v_status text;
BEGIN
  IF _entity_type = 'errand' THEN
    SELECT e.expires_at, e.status
      INTO v_expires, v_status
    FROM public.errands e
    WHERE e.id = _entity_id
    LIMIT 1;

    IF v_expires IS NULL OR v_status IS NULL THEN
      RETURN now();
    END IF;

    RETURN v_expires;
  ELSIF _entity_type = 'carpool' THEN
    SELECT tp.departure_date, tp.status
      INTO v_departure_date, v_status
    FROM public.travel_posts tp
    WHERE tp.id = _entity_id
    LIMIT 1;

    IF v_departure_date IS NULL OR v_status IS NULL THEN
      RETURN now();
    END IF;

    -- expires at start of the next day (end of departure day)
    RETURN (v_departure_date::timestamptz + interval '1 day');
  ELSE
    RETURN now();
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_chat_on_post(_entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO public
AS $$
DECLARE
  v_expires timestamptz;
  v_status text;
BEGIN
  IF _entity_type = 'errand' THEN
    SELECT e.expires_at, e.status
      INTO v_expires, v_status
    FROM public.errands e
    WHERE e.id = _entity_id
    LIMIT 1;

    RETURN (v_status = 'active' AND v_expires > now());
  ELSIF _entity_type = 'carpool' THEN
    -- Match existing behavior: only current/future rides
    SELECT public.chat_expires_at('carpool', _entity_id), tp.status
      INTO v_expires, v_status
    FROM public.travel_posts tp
    WHERE tp.id = _entity_id
    LIMIT 1;

    RETURN (v_status = 'active' AND v_expires > now());
  ELSE
    RETURN false;
  END IF;
END;
$$;

-- 3) Trigger to enforce expires_at server-side
CREATE OR REPLACE FUNCTION public.set_post_message_expires_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $$
BEGIN
  NEW.expires_at := public.chat_expires_at(NEW.entity_type, NEW.entity_id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_post_message_expires_at ON public.post_messages;
CREATE TRIGGER trg_set_post_message_expires_at
BEFORE INSERT ON public.post_messages
FOR EACH ROW
EXECUTE FUNCTION public.set_post_message_expires_at();

-- 4) RLS
ALTER TABLE public.post_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Post messages are viewable for active posts" ON public.post_messages;
CREATE POLICY "Post messages are viewable for active posts"
ON public.post_messages
FOR SELECT
USING (
  auth.uid() IS NOT NULL
  AND now() < expires_at
  AND public.can_chat_on_post(entity_type, entity_id)
);

DROP POLICY IF EXISTS "Users can send post messages" ON public.post_messages;
CREATE POLICY "Users can send post messages"
ON public.post_messages
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND sender_profile_id IN (SELECT p.id FROM public.profiles p WHERE p.user_id = auth.uid())
  AND public.can_chat_on_post(entity_type, entity_id)
);

-- Note: We intentionally do not allow UPDATE/DELETE; messages disappear automatically after expiry via RLS filter.
