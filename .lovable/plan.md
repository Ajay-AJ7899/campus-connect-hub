
## Summary of what you asked
1) When someone sends a request (carpool join request or errand request), it should create a notification and update the bell icon + messages list.
2) Add a “price/money” field to Carpooling posts and Errands posts, and display it in the cards.
3) Allow viewing other people’s profiles (driver, requester, etc.) from cards/notifications.

## What I found in your codebase (current state)
- `src/components/layout/Navbar.tsx` already shows a Bell icon, but it’s hardcoded to `0` and doesn’t open any list.
- You already have a `notifications` table with RLS that allows users to **read/update their own** notifications.
- Requests are created here:
  - Carpool: `src/components/carpooling/FindRides.tsx` inserts into `carpool_requests` (now includes a one-line message dialog).
  - Errands: `src/components/errands/ErrandsFeed.tsx` inserts into `contact_requests`.
- There is no “notifications inbox UI” yet.
- Carpooling + Errands currently have no “price” field in the DB tables shown; forms don’t collect it.
- You have `/profile` for your own profile, but no route/page to view *other* users’ profiles.

## Implementation approach (what I will build)

### A) Notifications: create + show in UI
#### A1) Backend: automatically create notifications when a request is made
Because normal users can’t insert notifications “for other people” (RLS blocks it), this must be done server-side using database trigger functions.

I will add database triggers:

1) On `carpool_requests` INSERT:
- Find the driver/owner profile id from `travel_posts.driver_id` using `NEW.travel_post_id`.
- Insert a notification row for that driver:
  - `user_id = driver_profile_id`
  - `type = 'carpool_request'` (or similar)
  - `title = 'New ride request'`
  - `message = one-line request message`
  - optionally store `related_post_id = NEW.travel_post_id` if your schema supports it (your `notifications` table has `related_post_id` already)

2) On `contact_requests` INSERT (for errands only):
- Use `NEW.owner_profile_id` as the notification receiver.
- Insert notification row:
  - `user_id = NEW.owner_profile_id`
  - `type = 'errand_request'`
  - `title = 'New errand request'`
  - `message = NEW.message`

Important guardrails:
- Do not notify if requester == owner (safety)
- Keep these functions `SECURITY DEFINER` and set `search_path` properly (matches existing patterns in your DB functions)

#### A2) Frontend: bell icon badge + notifications dropdown/panel
I will replace the hardcoded “0” badge in `Navbar.tsx` with a real unread count + a dropdown list.

Planned UI behavior:
- Bell badge shows the number of unread notifications (`is_read = false`).
- Clicking the bell opens a dropdown/panel that lists notifications (most recent first).
- Each notification row will show:
  - title
  - message snippet
  - relative time (e.g., “3m ago”)
  - “Mark read” on click (or automatically mark read when opened)
- When you click a notification:
  - Carpool request notification → goes to `/carpooling?tab=trips` (driver can approve/decline there)
  - Errand request notification → goes to `/errands?tab=my-requests` (if you have a proper requests inbox later); for now we can route to errands browse or create a minimal “My Requests (owner)” view depending on what exists.

Real-time updates:
- Use a `supabase.channel(...).on('postgres_changes'...)` subscription for the `notifications` table filtered to the current user, so the bell updates instantly.
- Also keep a fallback `react-query` refetch/polling in case realtime misses something.

Files likely involved:
- `src/components/layout/Navbar.tsx` (replace static badge + add dropdown)
- New component: `src/components/notifications/NotificationsMenu.tsx` (or similar)
- Potentially a small hook: `src/hooks/useNotifications.ts`

### B) Add “price/money” fields to Carpooling + Errands
You want the money shown so people can decide (“opt in”).

#### B1) Database schema changes
I will add optional price columns using integer cents (safer than float):

1) `travel_posts.price_cents integer null`
2) `errands.price_cents integer null`

Validation:
- Add a trigger or a simple constraint to ensure `price_cents >= 0` (if we use a check constraint it must be immutable; since it’s not time-based it’s fine).

#### B2) Update creation forms
1) Carpooling “Offer Ride” (`src/components/carpooling/OfferRide.tsx`)
- Add a “Price (optional)” input (example: “$5”).
- Convert dollars → cents before insert.
- Show “Free” or “—” if not set.

2) Errands “Post an Errand” (`src/components/errands/ErrandPostForm.tsx`)
- Add “Price / reward (optional)” input.
- Store as `price_cents`.
- Keep it optional (some errands might be unpaid).

#### B3) Display price in browse cards
1) Carpooling “Find Rides” (`src/components/carpooling/FindRides.tsx`)
- Fetch `price_cents` and display a badge (e.g., `$5` or `Free`) in the ride details row.

2) Errands feed (`src/components/errands/ErrandsFeed.tsx`)
- Display `Price` on the card near title or under it.

Also update TypeScript types:
- `src/components/errands/errands.types.ts` add `price_cents?: number | null` (and potentially `price_label` computed in UI).

### C) View other users’ profiles (driver/requester/host)
You want to view:
- driver profile from carpool cards
- requested people profiles (passengers) in “My Trips”
- errand owner profile from errand cards
- notification sender/receiver context (where possible)

#### C1) Add a public (authenticated) profile view route
Create a new page:
- `src/pages/UserProfile.tsx` (name can vary)
Route:
- `/users/:profileId` (or `/profile/:id` but avoid confusion with your own `/profile`)

Page behavior:
- Fetch profile by `id` from `profiles` table.
- Show:
  - name, avatar, verification, trips completed, bio, campus name (if you want to show it; it’s not sensitive in your current RLS since all authenticated can read profiles)
- If profile not found → show friendly “User not found”.

#### C2) Link to the profile view from UI
- Carpooling:
  - In `FindRides.tsx`, make the driver row clickable (“View profile” button or clicking avatar/name).
  - In `MyTripsTab.tsx`, make passenger chips clickable and driver block clickable.
- Errands:
  - In `ErrandsFeed.tsx`, add “View profile” link/button for the owner (or make the owner name clickable if displayed; currently you don’t display owner info, so we may add it via a join to profiles).

To support errands owner display, we may update the errands query to join `profiles`:
- `errands.select("*, requester:profiles!errands_requester_profile_id_fkey(...)")`
(We will confirm the FK name in generated schema/types and use the correct one.)

## Database work required (will require another “Modify database” approval)
One migration that includes:
- Add `price_cents` columns to `travel_posts` and `errands`
- Create trigger functions + triggers for notifications on:
  - `carpool_requests` insert
  - `contact_requests` insert

## Testing checklist (end-to-end)
1) Create a carpool ride with a price → verify it shows in Find Rides cards.
2) Post an errand with a price/reward → verify it shows in Browse.
3) From a second user, request to join a ride with a one-line message → verify:
   - driver immediately sees notification badge increase
   - notification appears in bell dropdown with message preview
   - clicking notification takes driver to My Trips (and request is visible)
4) From a second user, request an errand → verify:
   - errand owner gets notification
5) Click a driver/passenger/owner “View profile” link → verify profile page opens and shows correct info.

## Notes / small decisions I’ll implement by default
- Currency display: USD with `$` formatting.
- Price is optional; if empty, display “Free” (carpool) / “No price” or hide (errands) depending on UI readability.
- Notifications will be “unread” until you open/click them; opening the dropdown can mark all as read or we can mark individually (I’ll implement individual mark-read on click to be safer).

