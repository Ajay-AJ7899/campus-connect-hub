
Goal
- Replace the current “C” brand mark with your uploaded logo across:
  - Navbar
  - Footer
  - Auth page (left-side header) + Auth hero area
  - Browser tab icon (favicon)
  - Loading placeholders (the “C” shown while auth loads)

What I found in your codebase (current state)
- Navbar logo is hardcoded as a gradient square with a “C” letter (src/components/layout/Navbar.tsx).
- Footer logo is the same “C” mark (src/components/layout/Footer.tsx).
- Auth page header currently uses a Car icon in the brand block, not the “C” (src/pages/Auth.tsx).
- Auth hero (right side) has a small “Campus ONE • Smart matching” pill (src/components/auth/AuthHero.tsx).
- While auth is loading, the app renders a big gradient square with “C” in multiple places (src/App.tsx).
- index.html currently references /favicon.ico.

Asset strategy (clean + “tight fit”)
- Put the uploaded image into:
  - src/assets/brand-logo.png (for React components via import; best for bundling)
  - public/favicon.png (for favicon; must be in public and referenced by URL)
- “Tight fit” rendering approach:
  - Use an <img> with object-contain and a slightly larger internal scale so the logo doesn’t look tiny.
  - Keep the existing square container so the site keeps the same visual rhythm (rounded-xl, gradient background, shadow).

Implementation steps (what I will change)
1) Add the logo asset to the project
- Copy user-uploads://Gemini_Generated_Image_kd5jzykd5jzykd5j.png to:
  - src/assets/brand-logo.png
  - public/favicon.png

2) Navbar: replace “C” with the logo
File: src/components/layout/Navbar.tsx
- Import the image (import logo from "@/assets/brand-logo.png";).
- Replace the <span>C</span> with:
  - <img src={logo} alt="Campus ONE logo" ... />
- Keep the same container styling (w-10 h-10 rounded-xl gradient-primary).
- Apply tight-fit styles:
  - className like: "w-8 h-8 object-contain"
  - optionally add "drop-shadow-sm" or "contrast-125" if needed in dark mode.

3) Footer: replace “C” with the logo
File: src/components/layout/Footer.tsx
- Same approach as Navbar:
  - Import logo from src/assets
  - Replace the “C” span with <img ... />

4) Auth page brand block (left side): use the same logo
File: src/pages/Auth.tsx
- Replace the current Car icon in the brand mark container with the logo image.
- Keep the same size container (w-12 h-12) and gradient style so it matches the rest of the app.

5) Auth hero (right side): add the logo to the hero pill
File: src/components/auth/AuthHero.tsx
- Update the top pill “Campus ONE • Smart matching” to include a tiny logo at the start:
  - e.g., [logo] Campus ONE • Smart matching
- Use a small size (w-5 h-5) so it doesn’t distract.

6) Loading placeholders: replace “C” with the logo
File: src/App.tsx
- The loading UI appears in:
  - ProtectedRoute loading
  - AdminRoute loading
  - AppRoutes loading
- Replace the <span>C</span> inside those gradient squares with the same <img src={logo} ... />.
- Since App.tsx is not in a components folder, use:
  - import logo from "@/assets/brand-logo.png";
- Ensure the image is accessible before auth resolves (it will be, because it’s bundled).

7) Favicon: update the browser tab icon
Files: index.html, public/favicon.png
- Update index.html to reference the new file:
  - Add/replace with: <link rel="icon" href="/favicon.png" type="image/png" />
- Keep public/favicon.ico in place (harmless), but the app will use favicon.png.

8) Quick visual QA checklist (after implementation)
- Desktop:
  - Navbar logo looks centered and not squished.
  - Footer logo matches navbar size/feel.
  - Auth page logo renders correctly in both light/dark themes.
  - Favicon shows in the browser tab.
- Mobile:
  - Navbar logo stays crisp and aligned.
- Loading state:
  - The “C” no longer appears; logo shows instead.

Notes / options (non-blocking)
- If the logo appears too “small” due to whitespace in the image, we can:
  - Increase the <img> size inside the container (e.g., w-9 h-9) while keeping container dimensions unchanged, or
  - Swap to a cropped version of the logo later (ideal for a truly tight fit).

(Once you approve, I’ll implement the above changes and you’ll see the logo across the app.)
