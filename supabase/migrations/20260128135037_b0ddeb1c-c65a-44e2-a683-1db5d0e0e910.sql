-- Fix function search_path security warnings

-- 1. Fix update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 2. Fix handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$;

-- 3. Fix update_available_seats function
CREATE OR REPLACE FUNCTION public.update_available_seats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    UPDATE public.travel_posts
    SET available_seats = available_seats - 1
    WHERE id = NEW.travel_post_id AND available_seats > 0;
  ELSIF NEW.status = 'cancelled' AND OLD.status = 'approved' THEN
    UPDATE public.travel_posts
    SET available_seats = available_seats + 1
    WHERE id = NEW.travel_post_id;
  END IF;
  RETURN NEW;
END;
$$;