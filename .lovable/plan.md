
## What you asked for (locked-in requirements)
- Two access levels: **Users** and **Admins**, plus **one Super Admin**.
- **Admin routing**: Admins are notified / can view tickets **by campus**.
- **Urgent help ticket**:
  - Fields: category (medical, safety, etc.), urgency level, description
  - Status pipeline: **Open → Acknowledged → In progress → Resolved**
  - “Share location” button attaches latest coordinates to the ticket
  - Location **expires after 1 hour**
- **Super Admin**: account email `ajayarun9516@gmail.com`
- Super Admin can add additional admins and assign them **campus-wise**.

## Critical security notes (important)
- I will **not** hardcode or store any password in the app/database. The password you typed in chat will **not** be used anywhere in code.
- Roles will be stored in a **separate roles table** (not in profiles/users), as required.
- Admin checks will be done using **server-side validated role lookups**, not localStorage or “client flags”.

---

## Implementation plan

### 1) Explore & align with current app structure
- Keep your current auth flow (`/` shows Auth for logged-out, `/home` etc. for logged-in).
- Extend routing with:
  - `/help` fully implemented (report, active, my requests)
  - `/admin` new Admin Portal (admins + super admin only)
  - `/profile` new minimal profile page (needed so users can set **campus**, otherwise campus routing can’t work reliably)

### 2) Database design (schema) — secure + campus-routed
We’ll add new backend tables/enums to support roles, tickets, location sharing, routing, and notifications.

#### 2.1 Roles (separate table, safe RLS, no recursion)
Create:
- `public.app_role` enum including:
  - `super_admin`
  - `admin`
  - `user` (optional; we can omit and treat “no role row” as normal user)
- `public.user_roles` table:
  - `user_id` (uuid) — authenticated account id
  - `role` (app_role)
  - unique(user_id, role)

Add:
- `public.has_role(user_id, role)` **SECURITY DEFINER** function (per best practice) to avoid RLS recursion.
- RLS policies:
  - Normal users: can optionally read **only their own** roles (or no direct select at all)
  - Super admin: can manage roles for others (insert/delete/update)

#### 2.2 Campus assignment for admins (routing)
Create:
- `public.admin_campuses` table:
  - `user_id` (uuid) — admin’s account id
  - `campus_id` (uuid) — campus they manage
  - unique(user_id, campus_id)

Add:
- `public.is_admin_for_campus(_user_id, _campus_id)` SECURITY DEFINER function:
  - returns true if user is super_admin OR (admin AND mapped to that campus)

RLS policies:
- Only super_admin can add/remove mappings
- Admins can view their own mappings

#### 2.3 Urgent help tickets
Create:
- `public.help_ticket_category` enum: `medical`, `safety`, `mental_health`, `lost_item`, `other` (adjustable)
- `public.help_ticket_urgency` enum: `low`, `medium`, `high`, `critical` (adjustable)
- `public.help_ticket_status` enum: `open`, `acknowledged`, `in_progress`, `resolved`

Create table:
- `public.help_tickets`:
  - `id` uuid
  - `created_at`, `updated_at`
  - `requester_user_id` uuid (must equal auth user id at insert)
  - `campus_id` uuid (derived from requester profile campus)
  - `category`, `urgency`, `description`
  - `status` (default `open`)
  - `acknowledged_by` uuid nullable (admin user id)
  - `resolved_at` timestamp nullable

RLS rules:
- Requester can:
  - INSERT their own tickets
  - SELECT their own tickets
- Admins can:
  - SELECT tickets for campuses they manage
  - UPDATE status for campuses they manage
- Super admin can:
  - SELECT/UPDATE all tickets

Important validation:
- On insert, `campus_id` must match the requester’s current profile campus (prevents creating tickets in another campus).

#### 2.4 Location sharing (1-hour expiry)
Create table:
- `public.help_ticket_locations`:
  - `id` uuid
  - `ticket_id` uuid references help_tickets(id) on delete cascade
  - `lat` numeric, `lng` numeric
  - `captured_at` timestamp default now()
  - `expires_at` timestamp (captured_at + 1 hour)

Validation:
- Use a **validation trigger** (not a CHECK constraint) to ensure `expires_at > now()` and prevent nonsense inserts.

RLS:
- Requester can insert location only for **their own ticket**.
- Admins can select locations only if they can access the ticket’s campus.
- When `expires_at < now()`, the UI will treat location as expired and hide precision by default.

#### 2.5 Admin notifications (“notify to admins by campus”)
We already have a `notifications` table. We’ll reuse it for urgent-help alerts to keep the app consistent.

Approach:
- Create a database trigger `on help_tickets insert` that:
  - Finds all admins mapped to `help_tickets.campus_id` (and super admin)
  - Inserts a notification row for each admin (type `help_ticket`, title like “New urgent ticket”, message contains category/urgency summary, related_post_id can remain null or we can add `related_ticket_id` if we extend schema)

If we want clickable navigation, we’ll either:
- add a `related_ticket_id` column to `notifications`, OR
- encode ticket id in message (less ideal)

Recommended: add `related_ticket_id uuid null` to notifications (clean, easy deep-linking).

---

### 3) Bootstrap the Super Admin (safe, no password storage)
Because passwords must never be embedded anywhere:
1) You will **sign up normally** with `ajayarun9516@gmail.com` using the existing Auth screen.
2) After that account exists, we will run a one-time backend operation to:
   - insert into `user_roles` with role `super_admin` for that user id
3) The UI will then recognize you as Super Admin and show the Admin Portal + admin management tools.

Note: this is the only safe way to do it without shipping secrets/hardcoding credentials.

---

### 4) Frontend: build the Urgent Help feature (user-facing)
We’ll replace the “Coming soon” placeholders in `/help` tabs.

#### 4.1 Report tab (Create ticket)
- Form fields:
  - Category (select)
  - Urgency (select)
  - Description (textarea, with zod validation + length limits)
- Submit:
  - Creates help_tickets row
  - Immediately shows the created ticket detail view
- If the user has no campus set:
  - Show a clear message and button: “Set your campus to continue”
  - Link to `/profile` to select campus

#### 4.2 Ticket detail view (User)
- Shows status pipeline with timeline UI
- Shows “Share location” button:
  - Uses browser geolocation (permission prompt)
  - Sends lat/lng to `help_ticket_locations`
  - UI displays: “Location shared (expires in 1 hour)”
  - If expired, shows “Location expired” and prompts to re-share

#### 4.3 My Requests tab
- List of tickets created by the user
- Ability to open details
- Read-only status visibility (admin-driven)

#### 4.4 Active Tickets tab
Given your earlier requirement that tickets are admin-notified and campus-routed, we’ll implement “Active Tickets” as:
- For normal users: show only **their own active tickets**
- For admins: show **campus tickets** (or we can keep this in admin portal only; but your nav already includes it)

(If you later want a campus-wide redacted feed, we can add that as a separate public-safe view.)

---

### 5) Frontend: Admin Portal (/admin)
Access control:
- Only users with role `admin` or `super_admin` can enter.

Portal features:
1) **Tickets Inbox**
   - Filter by campus (super admin: all campuses; admin: their campus list)
   - Filter by status (Open/Acknowledged/In progress/Resolved)
   - Sort by newest / highest urgency
2) **Ticket detail**
   - Update status via buttons:
     - Acknowledge
     - Start progress
     - Resolve
   - If location exists and not expired:
     - show coordinates (and optionally a map later)
   - If expired:
     - show “Location expired”
3) **Admin Management (Super Admin only)**
   - Add admin (campus-wise):
     - Search/select an existing user (by email/name depending on what’s safe with your current profile visibility policies)
     - Assign role `admin`
     - Assign campus mapping(s)
   - Remove admin
   - View current admins per campus

---

### 6) In-app notifications UX
We will make the bell icon real:
- Fetch notifications for the logged-in user
- Badge count shows unread notifications
- Dropdown lists latest notifications
- Clicking an “Urgent Help” notification navigates to:
  - `/admin?ticket=<id>` for admins
  - `/help?tab=my-requests&ticket=<id>` (or ticket detail) for users

---

### 7) Testing checklist (end-to-end)
1) Create a normal user, set campus, create ticket
2) Share location; confirm expiry timestamp is ~1 hour in the future
3) Login as super admin, confirm:
   - Notification appears
   - Ticket appears in admin portal (campus filter correct)
   - Can update status pipeline
4) Add a campus admin; login as campus admin; confirm:
   - Sees only assigned campus tickets
5) Confirm location expires correctly (manually adjust time by waiting or by admin viewing after expiry) and UI hides expired location

---

## Files / areas that will be changed (high-level)
- Routing: `src/App.tsx` (add `/admin`, `/profile`, plus guarded admin route)
- New pages/components (planned):
  - `src/pages/Admin.tsx` (admin portal)
  - `src/pages/Profile.tsx` (campus selection)
  - `src/components/help/*` (create ticket, ticket lists, ticket detail)
  - `src/components/notifications/*` (notifications dropdown)
- Backend schema migration:
  - enums: roles, category, urgency, status
  - tables: `user_roles`, `admin_campuses`, `help_tickets`, `help_ticket_locations`
  - functions: `has_role`, `is_admin_for_campus`
  - triggers: updated_at, location expiry validation, notify admins on new ticket

---

## Notes about your provided email/password
- Email `ajayarun9516@gmail.com` will be used only to identify the account to grant **super_admin** AFTER you sign up.
- The password you wrote will not be stored or used anywhere in code. You should keep it private and change it if you already shared it elsewhere.

