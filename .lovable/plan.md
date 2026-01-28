

# Campus ONE - Your Campus Community Hub 🎓🚗

A vibrant, multi-campus platform that connects students for carpooling, errands, and emergencies. We'll start with a polished Travel & Carpool experience and expand from there.

---

## Phase 1: Foundation & Travel/Carpool (Starting Point)

### 1. User Authentication & Profiles
- **Sign up / Login** with email (supports both regular and .edu emails)
- **Campus selection** during registration (multi-campus support)
- **User profile** with:
  - Profile picture upload
  - Short bio
  - Campus affiliation
  - Verification badge (after email verification)
  - Trips completed counter (starts at 0)

### 2. Travel Post Creation
- Simple form to create a ride:
  - **From** location (with search/autocomplete)
  - **To** destination
  - **Date & Time** picker
  - **Mode** of transport (Car, Bus, Walk)
  - **Available seats** (for drivers)
  - Optional notes

### 3. Browse & Discover Rides
- **Feed of available rides** with vibrant cards showing:
  - Route, date, time, seats left
  - Driver's profile pic, name, badge, trip count
  - "Request to Join" button
- **Smart filters**:
  - By route (same origin/destination)
  - By time window (±30 min flexibility)
  - By campus
- **Smart matching** suggestions at the top showing best matches

### 4. Join & Manage Carpools
- **Request to join** a ride (driver approves)
- **Seat count** auto-updates when passengers join/leave
- **My Trips** section showing:
  - Trips I'm driving
  - Trips I've joined
- **Leave ride** option before departure

### 5. Notifications System
- **In-app notifications** (bell icon with badge):
  - Someone requested to join your ride
  - Your join request was approved/declined
  - A passenger left your carpool
- **Email notifications** for the same events

---

## Phase 2: Coming Next (After Travel is Solid)

### Errands & Group Orders
- Post errands (item, description, deadline, location)
- Accept/claim errands
- Group food orders ("I'm ordering from X at Y time")

### Urgent Help & Emergencies
- Create help tickets with category & urgency
- Status pipeline: Open → Acknowledged → In Progress → Resolved
- One-click location sharing

### Smart Matching Dashboard
- Hackathon/project team matching
- Opportunity recommendations
- Enhanced matching algorithms

---

## Design Vision 🎨

**Vibrant & Colorful** theme:
- Bright primary color (energetic blue or purple gradient)
- Warm accent colors (orange, yellow for CTAs)
- Clean white cards with subtle shadows
- Friendly rounded corners throughout
- Smooth animations and transitions
- Mobile-first, easy-to-use interface

---

## Technical Approach

- **Backend**: Supabase for authentication, database, and real-time updates
- **Email**: Email notification integration for ride updates
- **Responsive**: Works great on mobile and desktop
- **Real-time**: Live seat count updates when riders join/leave

