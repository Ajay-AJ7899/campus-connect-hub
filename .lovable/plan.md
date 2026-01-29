
## Goals from your request
1) Make the app feel **unified across Carpooling + Errands + Help** (balanced, not overly carpool-centric).
2) Build **Errands basic working MVP** including **photo upload (max 2 photos)**.
3) **Auto-remove (soft-expire / hide)**:
   - Errands: hide **2 days after posting**
   - Carpool posts: hide **end of the departure day**
4) Make the website **lighter / faster** (less heavy on initial load).

---

## A) Unify the UI across all feature hubs (Carpooling / Errands / Help)
### What will change
- Create a small shared header component used by all feature pages so they feel like one system:
  - Same layout (icon badge, title, subtitle)
  - Same spacing + typography
  - Feature-specific color gradients stay, but structure is consistent

### Implementation steps
1) Create a reusable header component (example: `FeatureHubHeader`)
   - Props: `icon`, `title`, `subtitle`, `gradientClass`
2) Replace the “Header” sections in:
   - `src/pages/Carpooling.tsx`
   - `src/pages/Errands.tsx`
   - `src/pages/Help.tsx`
   with the new unified header.
3) Ensure the tabs look consistent:
   - Keep the same Tabs styling and spacing (`TabsList` sizing, consistent icons, etc.)

### Result
Every hub page will feel like part of the same product, with consistent structure and navigation.

---

## B) Build Errands MVP (with photo upload, max 2 photos)
### MVP scope (basic working)
- Browse errands (feed)
- Post an errand (title, description, optional photos up to 2)
- My errands (posted by me)
- (No “group orders” yet; keep as Coming Soon for now unless you want it implemented)

### Backend changes (database + file storage)
We will add:
1) **File storage bucket** (for images)
   - Example bucket: `errand-photos`
   - Images will be stored in file storage; the database stores only file paths/URLs (never store image binaries).

2) **Database tables**
- `errands`
  - `id` uuid
  - `created_at`
  - `updated_at`
  - `requester_profile_id` (references `profiles.id`)
  - `campus_id` (references `campuses.id` or nullable, but recommended required if campus routing matters)
  - `title`
  - `description`
  - `status` (e.g., `active`, `expired`)
  - `expires_at` = `created_at + 2 days` (set at insert time)
- `errand_photos`
  - `id` uuid
  - `errand_id` uuid references `errands.id` on delete cascade
  - `path` (file path in storage)
  - `sort_order` smallint (0/1)
  - Enforce max 2 photos per errand at the app level; optionally also via DB trigger if needed.

3) **RLS policies**
- Errands:
  - Anyone authenticated can read active errands (or everyone if you want public browsing; recommended: authenticated only)
  - Users can insert their own errands only
  - Users can update/delete their own errands only
- Errand photos:
  - Users can insert photos only for errands they own
  - Users can read photos for errands they can read

### Frontend changes
1) Replace placeholders in `src/pages/Errands.tsx`:
   - Browse tab: list active errands
   - Post tab: real form
   - My requests tab: list my errands (active + expired)
2) Add components:
   - `ErrandPostForm` (title, description, photo picker/upload)
   - `ErrandsFeed` (cards showing title, description, campus, created time, photos)
   - `MyErrandsList`
3) Upload flow
   - On submit:
     1) Create errand row
     2) Upload up to 2 images to storage (namespaced by errand id + user)
     3) Insert rows into `errand_photos`
   - Add strong validation:
     - file type: image only
     - max size (reasonable limit per image)
     - max 2 images

---

## C) Auto-remove (soft-expire / hide) for Errands + Carpooling
You chose: **Soft-expire (hide)**.

### Errands expiry (after 2 days)
We will implement expiry in two layers:
1) UI + query filtering:
   - Browsing feed shows only `status=active` and `expires_at > now()`
2) Automatic status updates (optional but recommended):
   - Lightweight scheduled backend job can mark expired items daily/hourly.
   - If scheduling is not available immediately, the UI filtering still makes items “auto removed” to users.

### Carpool expiry (end of day)
Current carpool data is in `travel_posts` with fields:
- `departure_date`, `departure_time`, `status`

We will:
1) Update all “Find rides” queries to exclude expired:
   - Hide posts where `departure_date < today` (end-of-day rule)
   - Also keep `status='active'` filter
2) Add a status transition to `travel_posts`:
   - When day ends, mark `status='expired'` (optional job)
   - Even without a job, the UI/filter rule ensures old rides disappear.

---

## D) Make the website lighter (performance improvements)
### Biggest current “heavy” item
- The homepage hero video (`/videos/hero-video.mp4`) auto-plays and can be expensive on mobile.

### Changes we’ll make
1) **Video performance**
   - Use `preload="metadata"` instead of full preload
   - Add a `poster` image (so it loads fast before video)
   - Use `prefers-reduced-motion` to disable autoplay for users who prefer it
   - On small screens, optionally fallback to a static image instead of video

2) **Route-level code splitting**
   - Lazy load big pages:
     - Carpooling, Errands, Help, Admin portal, etc.
   - Keep Auth + shell small

3) **Reduce expensive visuals where needed**
   - Audit heavy shadows/animations (`shadow-glow`, `shadow-float-lg`, many `animate-*`)
   - Keep the “Gen Z / professional” feel but reduce always-on animation and large blur layers
   - Ensure the navbar “glass” effect is not over-blurred on low-end devices

### How we’ll verify “lighter”
- Check initial load time and bundle chunking (smaller initial JS)
- Confirm the home route feels faster on mobile

---

## E) Sequencing (what I will implement first)
1) Errands backend + storage (tables, bucket, RLS)
2) Errands MVP UI (browse/post/my errands) + photo upload (2 max)
3) Carpool + errands expiry filtering (soft-expire behavior)
4) Performance pass (video optimization + lazy loading)
5) Final UI unification polish across hub headers/tabs

---

## Notes / constraints (important)
- Passwords will never be hardcoded or stored.
- Photos will be stored in file storage; database will store only paths/URLs.
- “Auto removal” will be implemented as **soft-expire/hide** as you requested.

