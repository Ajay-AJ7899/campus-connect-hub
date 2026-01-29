
# Add Video Background to Home Page

## Overview

Integrate the uploaded video as a beautiful background element in the home page hero section, creating an immersive and attractive visual experience while maintaining the current soft pastel & floating cards design.

---

## What Will Change

### Hero Section Enhancement
The hero section will feature the video as a cinematic background with:
- Full-width video playing on loop (muted, autoplay)
- Semi-transparent overlay to ensure text readability
- Gradient fade at the bottom blending into the next section
- Video will be responsive and cover the entire hero area

### Visual Design
- Video will play behind the existing hero content
- Soft gradient overlay (white/cream) on top of video for contrast
- All existing text, greeting badge, and decorative elements stay the same
- Smooth transition from video hero to the feature cards section

---

## Implementation Steps

### Step 1: Copy Video to Project
- Copy the uploaded video file to `public/videos/hero-video.mp4`
- Using public folder since video files are large and benefit from direct serving

### Step 2: Update Index.tsx Hero Section
Add a video background element:
- Full-width `<video>` element with autoPlay, muted, loop, playsInline attributes
- Position absolute behind content with object-cover
- Add gradient overlay div on top of video for text readability
- Keep all existing content (greeting, heading, subheading)

### Step 3: Add CSS for Video Styling
- Add utility class for video overlay gradient
- Ensure video scales properly on all screen sizes
- Add subtle animation for overlay fade-in

---

## Technical Details

### Video Element Structure
```text
Hero Section
+------------------------------------------+
|  [Video Background - autoplay, loop]     |
|  +------------------------------------+  |
|  | Gradient Overlay (semi-transparent)|  |
|  | +--------------------------------+ |  |
|  | |    Content (greeting, text)   | |  |
|  | +--------------------------------+ |  |
|  +------------------------------------+  |
+------------------------------------------+
```

### Video Attributes
- `autoPlay` - Starts playing automatically
- `muted` - Required for autoplay in browsers
- `loop` - Continuous playback
- `playsInline` - Prevents fullscreen on mobile
- `poster` - Optional fallback image frame

### Performance Considerations
- Video placed in public folder for optimal streaming
- Lazy loading not needed for hero (above the fold)
- Muted video autoplays without user interaction
- Mobile: Video still plays but may fallback to poster on low bandwidth

---

## Files to Modify

| File | Changes |
|------|---------|
| `public/videos/hero-video.mp4` | New - Copy uploaded video |
| `src/pages/Index.tsx` | Add video element to hero section |
| `src/index.css` | Add video overlay styles if needed |

---

## Result Preview

```text
+------------------------------------------------------------------+
|  ███████████████ VIDEO BACKGROUND ███████████████               |
|  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓ (with gradient overlay) ▓▓▓▓▓▓▓▓▓▓▓▓▓▓         |
|                                                                  |
|                    ○ Welcome back, User! 👋                      |
|                                                                  |
|               Smarter Campus Life,                               |
|               Safer Together                                     |
|                                                                  |
|     Travel, errands, and emergency help — all in one place.     |
|                                                                  |
|  ░░░░░░░░░░░░░░░ (gradient fade to white) ░░░░░░░░░░░░░░░░░░░   |
+------------------------------------------------------------------+
|                                                                  |
|   [Carpooling Card]  [Errands Card]  [Help Card]                |
|                                                                  |
+------------------------------------------------------------------+
```

The video creates an engaging first impression while the overlay ensures all text remains perfectly readable.
