-- Campus ONE Database Schema

-- 1. Campuses table
CREATE TABLE public.campuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT NOT NULL DEFAULT 'USA',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on campuses (public read)
ALTER TABLE public.campuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Campuses are viewable by everyone"
  ON public.campuses FOR SELECT
  USING (true);

-- Insert some default campuses
INSERT INTO public.campuses (name, city, state, country) VALUES
  ('State University Main', 'Springfield', 'IL', 'USA'),
  ('Tech Institute', 'Boston', 'MA', 'USA'),
  ('City College', 'New York', 'NY', 'USA'),
  ('West Coast University', 'Los Angeles', 'CA', 'USA'),
  ('Southern Campus', 'Austin', 'TX', 'USA');

-- 2. User Profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  campus_id UUID REFERENCES public.campuses(id),
  is_verified BOOLEAN NOT NULL DEFAULT false,
  trips_completed INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- 3. Travel Posts table
CREATE TABLE public.travel_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  driver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_location TEXT NOT NULL,
  to_location TEXT NOT NULL,
  departure_date DATE NOT NULL,
  departure_time TIME NOT NULL,
  transport_mode TEXT NOT NULL CHECK (transport_mode IN ('car', 'bus', 'walk')),
  total_seats INTEGER NOT NULL DEFAULT 4,
  available_seats INTEGER NOT NULL DEFAULT 4,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  campus_id UUID REFERENCES public.campuses(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on travel_posts
ALTER TABLE public.travel_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Travel posts are viewable by everyone"
  ON public.travel_posts FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create travel posts"
  ON public.travel_posts FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own travel posts"
  ON public.travel_posts FOR UPDATE
  USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Users can delete their own travel posts"
  ON public.travel_posts FOR DELETE
  USING (driver_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- 4. Carpool Requests table
CREATE TABLE public.carpool_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  travel_post_id UUID NOT NULL REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  passenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'declined', 'cancelled')),
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(travel_post_id, passenger_id)
);

-- Enable RLS on carpool_requests
ALTER TABLE public.carpool_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view requests for their own posts or their own requests"
  ON public.carpool_requests FOR SELECT
  USING (
    passenger_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR travel_post_id IN (
      SELECT id FROM public.travel_posts WHERE driver_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Authenticated users can create carpool requests"
  ON public.carpool_requests FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Request owners and post owners can update requests"
  ON public.carpool_requests FOR UPDATE
  USING (
    passenger_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    OR travel_post_id IN (
      SELECT id FROM public.travel_posts WHERE driver_id IN (
        SELECT id FROM public.profiles WHERE user_id = auth.uid()
      )
    )
  );

-- 5. Notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('join_request', 'request_approved', 'request_declined', 'passenger_left', 'ride_cancelled')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_post_id UUID REFERENCES public.travel_posts(id) ON DELETE CASCADE,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "System can create notifications"
  ON public.notifications FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  USING (user_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()));

-- 6. Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_travel_posts_updated_at
  BEFORE UPDATE ON public.travel_posts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_carpool_requests_updated_at
  BEFORE UPDATE ON public.carpool_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create function to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 8. Function to update available seats when request is approved
CREATE OR REPLACE FUNCTION public.update_available_seats()
RETURNS TRIGGER AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_carpool_request_status_change
  AFTER UPDATE ON public.carpool_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_available_seats();

-- Enable realtime for notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.carpool_requests;