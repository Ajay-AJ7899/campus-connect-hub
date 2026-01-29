

# Remove "Offer Ride" Button from Navbar

## Overview

Remove the "Offer Ride" button from both the desktop and mobile navigation, as requested.

---

## What Will Change

### Desktop Navigation
Remove the "Offer Ride" button that appears next to the notifications bell icon (around line 147-153 in Navbar.tsx)

### Mobile Navigation  
Remove the "Offer Ride" link that appears at the bottom of the mobile menu (around lines 224-232 in Navbar.tsx)

---

## Implementation Details

### File: `src/components/layout/Navbar.tsx`

**Remove Desktop Button (lines 147-153):**
```tsx
// DELETE THIS BLOCK:
<Link to="/carpooling?tab=offer" className="hidden sm:block">
  <Button className="gradient-primary text-primary-foreground">
    <Plus className="w-4 h-4 mr-2" />
    Offer Ride
  </Button>
</Link>
```

**Remove Mobile Button (lines 224-232):**
```tsx
// DELETE THIS BLOCK:
{user && (
  <Link
    to="/carpooling?tab=offer"
    onClick={() => setIsOpen(false)}
    className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium gradient-primary text-primary-foreground mt-2"
  >
    <Plus className="w-5 h-5" />
    Offer Ride
  </Link>
)}
```

---

## Summary

| Location | Change |
|----------|--------|
| Desktop navbar (right side) | Remove "Offer Ride" button |
| Mobile menu (bottom) | Remove "Offer Ride" link |

The navigation will still have access to "Offer a Ride" through the Carpooling dropdown menu, so users can still reach this functionality.

