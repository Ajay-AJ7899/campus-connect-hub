-- 1) Price fields (integer cents)
ALTER TABLE public.travel_posts
  ADD COLUMN IF NOT EXISTS price_cents integer;

ALTER TABLE public.errands
  ADD COLUMN IF NOT EXISTS price_cents integer;

-- Non-negative constraints
DO $$ BEGIN
  ALTER TABLE public.travel_posts
    ADD CONSTRAINT travel_posts_price_cents_nonneg CHECK (price_cents IS NULL OR price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.errands
    ADD CONSTRAINT errands_price_cents_nonneg CHECK (price_cents IS NULL OR price_cents >= 0);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2) Notifications on request inserts
CREATE OR REPLACE FUNCTION public.notify_driver_on_carpool_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_driver_profile_id uuid;
  v_msg text;
BEGIN
  SELECT tp.driver_id
    INTO v_driver_profile_id
  FROM public.travel_posts tp
  WHERE tp.id = NEW.travel_post_id
  LIMIT 1;

  IF v_driver_profile_id IS NULL OR v_driver_profile_id = NEW.passenger_id THEN
    RETURN NEW;
  END IF;

  v_msg := COALESCE(NULLIF(btrim(NEW.message), ''), 'Someone requested to join your ride.');

  INSERT INTO public.notifications (user_id, type, title, message, related_post_id)
  VALUES (
    v_driver_profile_id,
    'carpool_request',
    'New ride request',
    v_msg,
    NEW.travel_post_id
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.notify_owner_on_contact_request_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_msg text;
BEGIN
  IF NEW.owner_profile_id = NEW.requester_profile_id THEN
    RETURN NEW;
  END IF;

  v_msg := COALESCE(NULLIF(btrim(NEW.message), ''), 'New request received.');

  INSERT INTO public.notifications (user_id, type, title, message)
  VALUES (
    NEW.owner_profile_id,
    CASE WHEN NEW.entity_type = 'errand' THEN 'errand_request' ELSE 'contact_request' END,
    CASE WHEN NEW.entity_type = 'errand' THEN 'New errand request' ELSE 'New request' END,
    v_msg
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_driver_on_carpool_request_insert ON public.carpool_requests;
CREATE TRIGGER trg_notify_driver_on_carpool_request_insert
AFTER INSERT ON public.carpool_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_driver_on_carpool_request_insert();

DROP TRIGGER IF EXISTS trg_notify_owner_on_contact_request_insert ON public.contact_requests;
CREATE TRIGGER trg_notify_owner_on_contact_request_insert
AFTER INSERT ON public.contact_requests
FOR EACH ROW
EXECUTE FUNCTION public.notify_owner_on_contact_request_insert();

-- 3) Realtime for notifications (safe if already enabled)
DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
