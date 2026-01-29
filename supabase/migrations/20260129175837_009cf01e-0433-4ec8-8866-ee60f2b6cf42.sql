-- Create a safe helper to create campuses from the client (avoids requiring elevated table INSERT permissions)
CREATE OR REPLACE FUNCTION public.create_campus(
  _name text,
  _city text,
  _state text DEFAULT NULL,
  _country text DEFAULT 'USA'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_name text;
  v_city text;
  v_state text;
  v_country text;
  v_existing_id uuid;
  v_new_id uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_name := nullif(btrim(_name), '');
  v_city := nullif(btrim(_city), '');
  v_state := nullif(btrim(_state), '');
  v_country := COALESCE(nullif(btrim(_country), ''), 'USA');

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Campus name is required';
  END IF;
  IF v_city IS NULL THEN
    RAISE EXCEPTION 'City is required';
  END IF;

  IF length(v_name) > 200 THEN
    RAISE EXCEPTION 'Campus name too long';
  END IF;
  IF length(v_city) > 120 THEN
    RAISE EXCEPTION 'City too long';
  END IF;
  IF v_state IS NOT NULL AND length(v_state) > 120 THEN
    RAISE EXCEPTION 'State too long';
  END IF;
  IF length(v_country) > 120 THEN
    RAISE EXCEPTION 'Country too long';
  END IF;

  -- Return existing campus if it already exists (case-insensitive match)
  SELECT c.id
    INTO v_existing_id
  FROM public.campuses c
  WHERE lower(c.name) = lower(v_name)
    AND lower(c.city) = lower(v_city)
    AND COALESCE(lower(c.state), '') = COALESCE(lower(v_state), '')
    AND lower(c.country) = lower(v_country)
  LIMIT 1;

  IF v_existing_id IS NOT NULL THEN
    RETURN v_existing_id;
  END IF;

  INSERT INTO public.campuses (name, city, state, country)
  VALUES (v_name, v_city, v_state, v_country)
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

-- Allow authenticated clients to call it
REVOKE ALL ON FUNCTION public.create_campus(text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.create_campus(text, text, text, text) TO authenticated;
