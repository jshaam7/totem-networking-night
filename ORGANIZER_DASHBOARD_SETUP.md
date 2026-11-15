# Organizer Dashboard — installation and tests

This is a **targeted extension** to the existing Career Connections Round 2 website. The public site, RSVPs, directory search/filter/save behavior, Turnstile, Netlify storage, event copy, and all profile data should remain unchanged. No live Netlify deploy has been performed.

## Files added

- `organizers.html` — organizer-only page at `/organizers.html`
- `organizers.css` — charcoal/orange dashboard styles
- `src/organizers.ts` — dashboard interactions and editor
- `netlify/functions/admin-auth.mjs` — signed, 4-hour HttpOnly organizer session
- `netlify/functions/admin-session.mjs` — sign in/status/sign out
- `netlify/functions/admin-profiles.mjs` — list, edit, publish, hide, permanently delete Blob profiles
- `netlify/functions/admin-photo.mjs` — authenticated access to pending/hidden profile photos
- `tests/admin-auth.test.mjs` — authorization and review visibility checks

## Files changed

- `netlify/functions/shared.mjs` — adds `publicProfile` helper
- `netlify/functions/profiles.mjs` — optionally holds new submissions for review; excludes hidden/pending from public directory
- `netlify/functions/photo.mjs` — excludes hidden/pending photos from public access
- `vite.config.ts` — adds the organizer HTML page to Vite's production build
- `src/App.tsx` — changes only the form success message **when review mode is enabled**, so guests aren't incorrectly told a pending profile is published

**Important:** `src/App.tsx` was based on the latest Round 2 correction patch available in this conversation. If you have newer local changes, merge the small success-message change instead of overwriting your file wholesale. Do not replace your own `src/data/profiles.json`, `public/images/`, Netlify configuration, or `.env` files. The patch intentionally excludes those.

## Before applying: protect your local work

```bash
cd ~/Desktop/networking-night-site
git status
# Commit or stash any work before applying the patch.
git switch main
git pull origin main
git switch -c feature/organizer-dashboard
```

Extract the PATCH zip to your Desktop, then copy ONLY the files inside its `Career_Connections_Organizer_Dashboard_PATCH` folder into corresponding project paths. A simple merge command on macOS:

```bash
PATCH="$HOME/Desktop/Career_Connections_Organizer_Dashboard_PATCH"
ditto "$PATCH/" "$(pwd)/"
```

**Do not run `ditto` until your local working tree is clean and you've checked `PATCH` points at the extracted patch, not the parent directory.** `ditto` overwrites same-name files, including `App.tsx`. Check `git diff` afterward.

## Local tests

```bash
npm install
npm test
npm run build
npm run dev
```

Visit `http://localhost:5173/organizers.html` to view the dashboard layout. **Login and persistent data require a live Netlify Functions deployment**; plain Vite serves only frontend assets.

## Optional approval queue

Netlify → Site configuration → Environment variables:

- Existing `ADMIN_REMOVE_TOKEN`: keep unchanged. This existing secret now also authorizes organizer login.
- Optional `PROFILE_REVIEW_REQUIRED`: `true` enables approval of **new** submissions before public listing. If not set or set to `false`, **the existing automatic-publication workflow is preserved**.
- Existing `TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`, `SUBMISSIONS_OPEN`: do not change.

Environment-variable changes require a new production deployment. Profile review applies only to new submissions; existing submissions remain published unless an organizer hides them. The organizer dashboard is not linked from the public navigation. Its URL is not secret; only a valid server-authenticated session can access management data.

## GitHub deployment

After local tests, commit changes and push the feature branch:

```bash
git add organizers.html organizers.css src/organizers.ts src/App.tsx vite.config.ts netlify/functions/ tests/admin-auth.test.mjs ORGANIZER_DASHBOARD_SETUP.md
git commit -m "Add authenticated organizer profile dashboard"
git push -u origin feature/organizer-dashboard
```

Create a GitHub PR into `main`. Deploy Previews may have separate Netlify Blob stores and environment context. Test against **a throwaway submitted profile**, never a real person's record, and do not expose the admin token in screenshots or PR discussions. When the preview works, merge to `main`; Netlify will deploy automatically.

## Production smoke tests

1. Open `https://ubcnetworking.netlify.app/organizers.html`.
2. Try a wrong token — expect denied. Use the existing `ADMIN_REMOVE_TOKEN` from your password manager; successful login displays the submitted profiles, not your original seed/dummy JSON profiles.
3. Submit a fake profile from the public form; verify the existing published behavior or, with review mode enabled, that it is **pending** and not public.
4. In dashboard, search, edit fields, replace photo, save, refresh, approve/hide, and verify changes appear or disappear in public directory.
5. Delete the fake profile; verify its photo is gone. Sign out and verify dashboard actions are blocked.
6. Check public directory filters, bookmarks, modal, navigation, RSVP, Google Maps, profile submission, photo upload and Turnstile still function.
7. Test on mobile. Check browser console and Netlify Functions logs for errors.

## Data ownership and operational limits

- **Editable in dashboard:** web-form submissions in Netlify Blobs (IDs starting `submitted-`).
- **Not editable in dashboard:** profiles in `src/data/profiles.json` (including seed/demo entries and Shaam's original profile). These require a GitHub edit and deploy.
- **RSVPs:** still collected by the separate Google Form; the dashboard does not access Google Form responses.
- **Login:** uses the existing admin token to obtain a signed HttpOnly, Secure, SameSite=Strict cookie valid for four hours. No password or token is stored in localStorage. Both organizers can use the token if you share it through a secure password manager. Separate per-organizer accounts and audit logs are **not included**.
- **Delete:** permanent, not recoverable in the app. No email notifications or backups are added.
- **Privacy:** a pending/hidden profile and its photo do not appear in public API responses; administrator-only photo access is authenticated.
- **Security:** these checks do not replace a production penetration test. The admin secret should be a high-entropy random value (ideally 32 bytes generated via `openssl rand -hex 32`). Rotate it through Netlify if compromised.

## Rollback

In Netlify → Deploys, publish a previous successful deployment. Because GitHub automatically builds `main`, also revert the problematic PR on GitHub to keep the rollback in place. Review mode must be turned off separately via `PROFILE_REVIEW_REQUIRED=false` if you enabled it and want immediate publication again.
