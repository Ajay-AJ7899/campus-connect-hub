
## What’s going wrong (based on the actual network errors)
### 1) Group Orders + Help: “new row violates row level security”
Your backend rules for **Group Orders** and **Help Tickets** require that:
- the row’s `campus_id` must match **the campus stored on your profile in the database** (via `current_user_campus_id()`).

But your requests are sending `campus_id = d00eee... (City College)` while your profile campus in the database was changed to something else earlier (example in logs: `5a9218...`).

So the backend correctly rejects the insert with **403 + RLS violation**.

This is why:
- `POST /group_orders` fails with RLS
- `POST /help_tickets` fails with RLS

### 2) Profile page 404
Navbar links to `/profile`, but `src/App.tsx` has **no route** for `/profile` and `src/pages` has **no Profile.tsx** page. So it will always 404.

### 3) “Request button + one line message”
You asked to add this for:
- Carpooling rides (request-to-join + message)
- Errands (request help + one-line message)
And you want **Group Orders to remain instant-join** (no approval required).

Also you chose: **Campus switching = Lock campus** (after signup).

---

## Goals
1) Fix Group Orders + Help inserts so they stop failing due to campus mismatch.
2) Add the missing `/profile` page (no more 404).
3) Add “Request” button + one-line message for:
   - Carpooling rides (store it on `carpool_requests.message`)
   - Errands (store it using the existing `contact_requests` table)
4) Enforce “campus lock” after signup (only set campus if it’s currently empty).

---

## Implementation plan

### A) Fix the campus mismatch that causes RLS failures (most important)
We’ll do this in two layers (so it’s robust):

#### A1) Frontend: stop overwriting campus after signup (campus lock)
Update `src/pages/Auth.tsx`:
- On **signup**: campus is required → set it on the user profile (same as now).
- On **login**: campus picker is optional for “suggestions only”
  - If the profile already has a campus → **do not update the database campus**
  - If the profile campus is empty → set it (to fix old accounts with missing campus)
- Also, when we do update the profile campus (signup or empty campus), we will update the in-app `profile` state immediately so the rest of the app uses the correct campus right away.

#### A2) Backend safety: add triggers to force correct `campus_id` on insert (prevents stale UI from breaking inserts)
Add a database migration to:
- Create a small trigger function that sets `NEW.campus_id = current_user_campus_id()` on insert
- Attach it as a **BEFORE INSERT** trigger on:
  - `group_orders`
  - `help_tickets`

Result:
- even if the UI accidentally sends the wrong campus id, the database will overwrite it to the user’s real campus and RLS will pass.

This also makes your system more secure (client cannot “spoof” campuses).

---

### B) Fix Profile 404 by adding a Profile page + route
Create:
- `src/pages/Profile.tsx` (new)

Update:
- `src/App.tsx` to add a protected route: `/profile`

Profile page behavior (simple, useful, safe):
- Show name, email, verification, trips completed
- Show campus name (read-only; since campus is locked)
- Allow editing safe fields like `full_name` / `bio` (optional; if you want, we can start read-only first and add editing next)

---

### C) Add “Request + one-line message” UI

#### C1) Carpooling rides (Find Rides)
Update `src/components/carpooling/FindRides.tsx`:
- When user clicks “Request to Join”, open a dialog:
  - one-line message input (ex: max 140 chars)
  - submit inserts into `carpool_requests` with:
    - `travel_post_id`
    - `passenger_id = profile.id`
    - `message = typed message`
- Keep the existing “Already requested” handling.
- Optional improvement: disable request button after request is sent (or show “Requested”).

#### C2) Errands feed
Update `src/components/errands/ErrandsFeed.tsx` (feed mode only):
- Add a “Request” button on each errand card (not shown on “mine” tab, and not shown for your own errands)
- On click, open dialog with one-line message
- Insert into `contact_requests`:
  - `entity_type = "errand"`
  - `entity_id = errand.id`
  - `owner_profile_id = errand.requester_profile_id`
  - `requester_profile_id = current profile.id`
  - `message = typed message`

#### C3) Prevent spam duplicates (recommended)
Add a database migration:
- Add a UNIQUE constraint to `contact_requests` to prevent multiple pending requests from the same requester for the same thing:
  - Unique on `(entity_type, entity_id, requester_profile_id)`
Then in UI:
- If insert fails with duplicate constraint, show toast “You already requested this”.

---

## Files we’ll likely change
Frontend:
- `src/pages/Auth.tsx` (campus lock + immediate profile sync)
- `src/contexts/AuthContext.tsx` (optional: helper to refresh profile after updates, if needed)
- `src/App.tsx` (add `/profile` route)
- `src/pages/Profile.tsx` (new)
- `src/components/carpooling/FindRides.tsx` (request dialog + message)
- `src/components/errands/ErrandsFeed.tsx` (request dialog + message)
- (Possibly) create a small reusable dialog component for “RequestMessageDialog” if we want to avoid duplication

Backend (migrations):
- Trigger(s) to force campus_id on insert for `group_orders`, `help_tickets`
- Unique constraint on `contact_requests`

---

## Testing checklist (end-to-end)
1) Sign in → go to Errands → Group Orders → create order → should succeed (no RLS error).
2) Go to Help → Report → submit help ticket → should succeed (no RLS error).
3) Navbar → Profile → should open (no 404).
4) Carpooling → Find Rides → Request to Join → type message → submit → should create a request with message.
5) Errands feed → Request on an errand → type message → submit → should create a contact request; clicking again should show “already requested”.

---

## Notes / constraints from your choices
- “Campus switching = Lock campus”: after this change, campus can be set on signup (required) and only auto-set later if the profile campus is empty. Profile page will show campus read-only.

