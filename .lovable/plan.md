
## Goals (what you asked)
1) Show all money amounts in Indian Rupees (₹) instead of USD ($).
2) Create an Admin section where an admin can:
   - See campus-scoped summaries for Help, Carpooling, Errands (and “chats/requests”).
   - Download each section as Excel-ready CSV files.
   - Filter each section by date range.
3) Include “chats” exports for:
   - Carpool request messages
   - Errand request messages
   - Help ticket chat (this does not exist yet, so we will add it)

You confirmed:
- Currency: INR (₹) everywhere
- Export format: CSV (Excel-ready)
- Admin scope: campus-scoped admin (Super Admin can access all campuses)

---

## Current state (what exists already)
- Prices are stored as `price_cents` integer in:
  - `travel_posts.price_cents`
  - `errands.price_cents`
- The UI formats money via `src/lib/money.ts` (`formatMoneyFromCents`, default currency currently “USD”) and parses user input via `parseMoneyToCents`.
- Notifications UI exists (bell dropdown), and database already creates notifications for request inserts.
- Roles are correctly stored in a separate `user_roles` table, with server-side `has_role()` and campus admin mapping via `admin_campuses`.
- There is no admin page/route yet.
- There is no help ticket “chat/messages” table yet.

---

## Implementation plan

### 1) Switch currency display to INR (₹) everywhere
**Frontend changes**
1. Update `src/lib/money.ts`
   - Change default currency from `"USD"` to `"INR"` in `formatMoneyFromCents`.
   - Set locale to `"en-IN"` for Indian grouping (e.g., 1,00,000).
   - Keep cents logic (it maps cleanly to paise: 100 paise = ₹1).

2. Update placeholders and labels that show `$`:
   - `src/components/carpooling/OfferRide.tsx` placeholder `"$5"` → `"₹50"` (example)
   - `src/components/errands/ErrandPostForm.tsx` placeholder `"$10"` → `"₹100"` (example)
   - Any other visible currency strings found via search.

3. Keep storage unchanged (still integer “cents”), only display changes to ₹.

**Edge cases**
- If a price is `0`, keep showing “Free” (or optionally “₹0”). I’ll keep “Free” because it reads better in cards.

---

### 2) Create Admin section (campus-scoped) with summary + CSV downloads

#### 2A) Backend: add secure “admin reporting” RPC functions
Because admin data must be campus-filtered and secure, we’ll implement reporting via database functions that:
- Validate the current user (using `auth.uid()` internally).
- Enforce admin access using existing `has_role()` / `is_admin_for_campus()` logic.
- Return rows already filtered to the campus the admin is allowed to see.

**New functions to add (migration)**
1) `public.admin_accessible_campuses()`
- Returns campuses the current user can manage:
  - If `super_admin`: all campuses
  - If `admin`: the single campus in `admin_campuses`
- This avoids client-side role logic and allows a clean campus selector in the Admin UI.

2) `public.admin_dashboard_summary(_campus_id uuid, _from timestamptz, _to timestamptz)`
- Returns counts like:
  - Help tickets: total/open/acknowledged/resolved in range
  - Travel posts created in range + active now
  - Errands created in range + active now
  - Carpool requests created in range
  - Errand requests (contact_requests) created in range
- Validates the caller is admin for `_campus_id` (or super admin).

3) Export functions returning detailed rows for CSV download:
- `public.admin_export_help_tickets(_campus_id uuid, _from timestamptz, _to timestamptz)`
  - Include fields: ticket id, created_at, category, urgency, status, requester_user_id, requester name/email (join to profiles via `profiles.user_id = help_tickets.requester_user_id`), resolved_at, acknowledged_by
- `public.admin_export_travel_posts(_campus_id uuid, _from timestamptz, _to timestamptz)`
  - Include: id, created_at, from/to, date/time, seats, price_cents, status, driver profile fields (join profiles)
- `public.admin_export_errands(_campus_id uuid, _from timestamptz, _to timestamptz)`
  - Include: id, created_at, title, status, expires_at, price_cents, requester profile fields (join profiles)
- `public.admin_export_carpool_requests(_campus_id uuid, _from timestamptz, _to timestamptz)`
  - Include: request id, created_at, status, message, travel_post_id, driver profile, passenger profile
- `public.admin_export_errand_requests(_campus_id uuid, _from timestamptz, _to timestamptz)`
  - Export from `contact_requests` where `entity_type='errand'` with: id, created_at, status, message, entity_id, owner profile, requester profile

All these functions should be `SECURITY DEFINER`, set `search_path` to public, and internally ensure:
- `auth.uid()` is not null
- The user is authorized for `_campus_id` using `is_admin_for_campus(auth.uid(), _campus_id)` or `has_role(auth.uid(), 'super_admin')`

This keeps admin access server-validated (no localStorage checks, no client trust).

---

#### 2B) Frontend: Admin route + Admin UI
**Routing**
- Add a new protected route: `/admin`
- Add an `AdminRoute` wrapper that:
  - Requires login
  - Checks admin privileges server-side (via RPC), not via client flags

**Admin UI page**
Create `src/pages/Admin.tsx` (name can be adjusted) with:
- Campus selector:
  - If Super Admin: dropdown of accessible campuses from `admin_accessible_campuses()`
  - If Admin: fixed campus (read-only label)
- Date range filter (From / To)
  - Default: last 7 days
- Tabs or sections:
  1) Summary
  2) Help
  3) Carpooling
  4) Errands
  5) Chats / Requests

Each section:
- Shows a small table preview (e.g., latest 20 rows)
- Includes a “Download CSV” button that exports the full filtered dataset.

**CSV download approach (no extra dependencies)**
- Fetch rows from the corresponding RPC export function.
- Convert JSON rows to CSV (escape commas/quotes/newlines properly).
- Trigger a browser download with a filename like:
  - `help_<campus>_2026-01-01_to_2026-01-29.csv`
  - `carpool_requests_<campus>_<range>.csv`

This opens cleanly in Excel.

**Navbar**
- Add an “Admin” menu item only if user is admin (determined via RPC), e.g. in profile dropdown.

---

### 3) Add “Help ticket chat” feature + export (because you asked for chats)
Right now, help tickets do not have a messages table. To support “help ticket chat” and downloads, we will implement:

#### 3A) Database: new table for ticket messages
Create table `help_ticket_messages`:
- `id uuid primary key default gen_random_uuid()`
- `ticket_id uuid not null references help_tickets(id) on delete cascade`
- `sender_user_id uuid not null` (store auth user id, not profile id, since tickets already use `requester_user_id`)
- `message text not null`
- `created_at timestamptz not null default now()`

**RLS policies**
- SELECT allowed if `can_access_ticket(auth.uid(), ticket_id)` is true (you already have this function).
- INSERT allowed if:
  - requester of the ticket OR admin for that ticket’s campus:
  - `can_access_ticket(auth.uid(), ticket_id)` AND `sender_user_id = auth.uid()`
- No UPDATE/DELETE for normal users (keeps history stable). Super admin could have broader privileges if desired.

#### 3B) UI: minimal “Help ticket chat” interface (admin + requester)
Because you want admin section + exports, we need at least minimal UI to create messages; otherwise there would be nothing to export.

We’ll implement:
- In Help area (likely in “My Requests” first, and in Admin Help view):
  - A “View details” panel for a ticket
  - Messages list
  - One-line / multi-line message input
  - Send button (inserts into `help_ticket_messages`)

Optional (recommended):
- Trigger notification on new help_ticket_messages insert to notify the other party (admin or requester). This can be a follow-up if you want.

#### 3C) Admin export for help chat
Add RPC:
- `admin_export_help_ticket_messages(_campus_id uuid, _from timestamptz, _to timestamptz)`
  - Join to help_tickets to filter by campus
  - Include sender info by joining `profiles` on `profiles.user_id = sender_user_id`

---

## Database migration(s) required
We’ll need at least one “Modify database” migration for:
1) Create `help_ticket_messages` table + RLS policies
2) Create admin reporting functions:
   - `admin_accessible_campuses`
   - `admin_dashboard_summary`
   - `admin_export_*` functions for each section (including help chat export)

No existing tables need destructive changes.

---

## Testing checklist (end-to-end)
1) Prices:
- Post a ride with price `₹50` → confirm it displays as `₹50` (not `$`).
- Post an errand with price → confirm it displays in ₹ with Indian formatting.
2) Admin access:
- Login as normal user → cannot access `/admin` (redirect/blocked).
- Login as admin → can access `/admin` and sees only their campus.
- Login as super admin → can select different campuses.
3) CSV exports:
- Download Help CSV for a date range → opens correctly in Excel.
- Download Carpool Requests + Errand Requests CSV → includes message (“chat”) column and correct campus filtering.
4) Help chat:
- Create a help ticket → add a chat message as requester.
- Admin views the ticket and replies.
- Export help chat CSV and verify messages are included and filtered by campus/date.

---

## Notes / decisions I will follow (to match your requirements)
- Currency: INR (₹) everywhere; storage remains integer paise-based.
- Admin scope is campus-limited for admins; super admin can access all campuses.
- Exports are CSV (Excel-ready), no extra dependencies.
- “Chats” includes: carpool request messages, errand request messages, and help ticket chat (implemented via a new messages table).

