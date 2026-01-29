-- Fix 1: Restrict profiles table SELECT to authenticated users only
-- This prevents public scraping of user emails and personal information
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles"
  ON public.profiles FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Fix 2: Restrict notifications INSERT to prevent users from creating fake notifications for others
-- Users can only create notifications for themselves, or system (via service role) can create for anyone
DROP POLICY IF EXISTS "System can create notifications" ON public.notifications;

CREATE POLICY "Users can only create notifications for themselves"
  ON public.notifications FOR INSERT
  WITH CHECK (
    user_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );