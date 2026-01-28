
# Campus ONE - Navigation Restructure & Feature Hubs

## Overview

Transform the app to have a consolidated navigation with dropdown menus, where each main feature area (Carpooling, Errands, Urgent Help) lives in its own hub page. Plus, add attractive clickable feature icons on the home page that link directly to each hub.

---

## What You'll Get

### New Home Page with Feature Icons
A vibrant section with 3 large, attractive clickable cards on the home page:
- **Carpooling** - Car icon with gradient background, links to /carpooling
- **Errands & Orders** - Shopping bag icon, links to /errands  
- **Urgent Help** - Shield/alert icon, links to /help

Each card will have:
- Large colorful icon with gradient background
- Feature title and short description
- Hover animation effects (scale, glow)
- Clickable entire card

### New Navigation Structure

```text
+------------------------------------------------------------------------+
|  [Logo] Campus ONE    | Carpooling ▾ | Errands ▾ | Help ▾ |   [User]   |
+------------------------------------------------------------------------+
                              |              |             |
                     +--------+-------+      |             |
                     | Find Rides     |      |             |
                     | Offer a Ride   |      |             |
                     | My Trips       |      |             |
                     +----------------+      |             |
                                             |             |
                               +-------------+-------------+
                               | Browse Errands            |
                               | Post Errand               |
                               | Group Orders              |
                               | My Requests               |
                               +---------------------------+
                                                           |
                                              +------------+-----------+
                                              | Report Emergency       |
                                              | Active Tickets         |
                                              | My Help Requests       |
                                              +------------------------+
```

### 3 New Hub Pages

1. **Carpooling Hub** (`/carpooling`) - Tabs for Find Rides, Offer Ride, My Trips
2. **Errands Hub** (`/errands`) - Tabs for Browse, Post Errand, Group Orders, My Requests
3. **Help Hub** (`/help`) - Tabs for Report Emergency, Active Tickets, My Requests

---

## Implementation Steps

### Step 1: Update Navbar with Dropdown Menus
- Replace simple links with dropdown menus for each feature area
- Add Carpooling, Errands, and Help as main navigation items
- Each dropdown shows quick links to navigate to specific tabs
- Mobile: Expandable accordion sections

### Step 2: Create Carpooling Hub Page
- New `/carpooling` route combining all carpooling features
- Move existing Find Rides, Offer Ride, and My Trips into tab components
- Support URL query param `?tab=find|offer|trips` for deep linking
- Remove old individual pages (`/rides`, `/create-ride`, `/my-trips`)

### Step 3: Create Database Tables for Errands & Help
New database tables:
- **errands** - For posting errand requests (item, location, deadline, status)
- **group_orders** - For group food/item orders
- **group_order_items** - Items within group orders
- **help_tickets** - Emergency tickets with category, urgency, location

### Step 4: Create Errands Hub Page
- New `/errands` route with tabs:
  - Browse Errands - See requests from others
  - Post Errand - Create new errand
  - Group Orders - View/create collaborative orders
  - My Requests - Track your errands

### Step 5: Create Help Hub Page
- New `/help` route with tabs:
  - Report Emergency - Create urgent help ticket
  - Active Tickets - Community help requests
  - My Requests - Your submitted tickets

### Step 6: Update Home Page
- Add vibrant "Quick Access" section with 3 large clickable feature cards
- Each card links to its respective hub page
- Update existing CTA buttons to point to new routes
- Keep the feature benefits section but update descriptions

### Step 7: Update Routing
- Add new routes: `/carpooling`, `/errands`, `/help`
- Set up redirects from old routes to new hubs

---

## Technical Details

### Navbar Component Changes
- Use NavigationMenu from Radix for accessible dropdown navigation
- Each main nav item opens a dropdown with sub-links
- Sub-links navigate to hub pages with query params (e.g., `/carpooling?tab=offer`)
- Mobile: Collapsible sections with Collapsible component

### Hub Pages Tab Structure
```text
// URL: /carpooling?tab=offer

+--------------------------------------------------+
| Carpooling                                       |
+--------------------------------------------------+
| [Find Rides] [Offer Ride*] [My Trips]            |  <- Tabs
+--------------------------------------------------+
|                                                  |
|    Offer Ride Form (active tab content)          |
|                                                  |
+--------------------------------------------------+
```

### Feature Cards on Home Page
Large vibrant cards with:
- Icon size: 64x64px in a gradient circle
- Card hover: scale-105 with shadow-glow
- Link wrapper for full-card clickability
- Animated icons on hover

### New Database Schema

**errands table:**
- id, requester_id, title, description, location
- needed_by (timestamp), status (open/accepted/completed)
- accepted_by, campus_id, timestamps

**group_orders table:**
- id, creator_id, restaurant_name, order_deadline
- pickup_location, status, campus_id, timestamps

**group_order_items table:**
- id, group_order_id, user_id, item_description, notes

**help_tickets table:**
- id, requester_id, category (medical/safety/academic/other)
- urgency_level (low/medium/high/critical)
- title, description, status pipeline
- location_lat, location_lng, location_expires_at
- campus_id, timestamps

### File Structure
```text
src/
  pages/
    Index.tsx          (updated with feature cards)
    Carpooling.tsx     (new hub page)
    Errands.tsx        (new hub page)
    Help.tsx           (new hub page)
  components/
    layout/
      Navbar.tsx       (updated with dropdowns)
    carpooling/
      FindRides.tsx    (moved from Rides.tsx)
      OfferRide.tsx    (moved from CreateRide.tsx)
      MyTrips.tsx      (moved from MyTrips.tsx)
    errands/
      BrowseErrands.tsx
      PostErrand.tsx
      GroupOrders.tsx
      MyErrandRequests.tsx
    help/
      ReportEmergency.tsx
      ActiveTickets.tsx
      MyHelpRequests.tsx
```

---

## Design Preview

### Home Page Feature Cards

```text
+-------------------+  +-------------------+  +-------------------+
|    🚗             |  |    🛒             |  |    🆘             |
|   CARPOOLING      |  |     ERRANDS       |  |   URGENT HELP     |
|                   |  |                   |  |                   |
| Share rides with  |  | Get help with     |  | Report emergencies|
| fellow students   |  | tasks & orders    |  | & get assistance  |
+-------------------+  +-------------------+  +-------------------+
```

Each card will have:
- Gradient background matching the app's vibrant theme
- Large animated icon
- Smooth hover effects with glow
- Click anywhere to navigate

---

## Summary of Changes

| What | Description |
|------|-------------|
| Navbar | Dropdown menus for Carpooling, Errands, Help |
| Home Page | Add 3 large clickable feature cards |
| `/carpooling` | New hub combining Find/Offer/My Trips |
| `/errands` | New hub for errands and group orders |
| `/help` | New hub for emergency assistance |
| Database | 4 new tables for errands and help features |
| Old routes | Redirect `/rides`, `/create-ride`, `/my-trips` to `/carpooling` |
