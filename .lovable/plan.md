
Goal: Fix the “Email signups are disabled” error so anyone can create an account and sign in with email + password (no Google login), while keeping password rules minimal (as you requested earlier).

What’s happening now
- Your app’s signup calls the backend auth method `signUp(email, password, …)`.
- The error “Email signups are disabled” does not come from your React code; it comes from backend authentication settings (email/password provider is turned off).
- Separately, “rate exceeded” errors are a backend protection. We can improve the UI message, but we cannot force unlimited signups instantly if the backend blocks it.

Scope of changes
A) Backend setting (required)
1. Open Lovable Cloud backend settings for Authentication.
2. Enable Email/Password signups (sometimes labeled “Email provider” or “Email auth”).
3. Ensure “Allow signups” is enabled.
4. (Optional, only if you want) If you previously requested “no verification / easy access”, ensure email confirmation is not required. If you prefer normal verification, keep it enabled.

B) Frontend changes (to make behavior clear and remove confusion)
1. Keep Google login removed (already removed from `src/pages/Auth.tsx` UI; we’ll double-check no other Google buttons exist).
2. Improve error handling in `src/pages/Auth.tsx` so when backend returns “Email signups are disabled”, the user sees a clear message like:
   - “Signups are currently disabled by backend settings. Please contact the app owner.”
   (So you immediately know it’s a settings issue, not a password problem.)
3. Keep the “weak password allowed” validation (already `min(1)`).
4. Add a small “cooldown” UX when rate-limited:
   - Disable the signup button for ~30–60 seconds after a rate-limit error and show a countdown.
   - This reduces repeated clicks that keep triggering rate limit.
5. (Optional) Add a “Try login instead” helper when signup fails with “already registered”.

C) Verification steps (end-to-end)
1. After enabling email signups, test on route `/`:
   - Create account with a new email + 1-character password.
   - Confirm it navigates to `/home`.
   - Sign out, then sign back in with the same credentials.
2. Try 2–3 signups quickly to confirm rate-limit messaging behaves well.

Notes / tradeoffs (important)
- If you truly want “everyone can use everything without login”, that is a much bigger change because your database rules and many features assume an authenticated user and a profile. You selected “keep login”, so we’re not doing that.
- “Rate exceeded” can still happen under heavy signup bursts; we can’t safely remove backend rate limiting, but we can make the app experience smoother and clearer.

Files likely to be updated
- `src/pages/Auth.tsx` (error handling + cooldown UX)
- Possibly `src/components/layout/Navbar.tsx` or related nav components (only if there are leftover Google login links elsewhere)

Backend action needed
- Enable email/password signups in Lovable Cloud authentication settings (this is the root cause of “Email signups are disabled”).
