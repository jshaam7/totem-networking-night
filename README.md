# Career Connections — Totem Park Networking Night

A mobile-first, filterable networking directory for the **November 24, 2026, 6–8 PM** RA event in the **UBC Totem Park Ballroom**.

**Demo contents:** 1 profile imported from the provided organizer CSV (with website and LinkedIn display consent), plus **16 explicitly fictional placeholder profiles**. Fictional profiles are not confirmed guests. The website shows no organizer notes or private consent fields.

## Technology

- **React 18 + TypeScript:** typed reusable components, easy extension to an organizer-managed portal later.
- **Vite 6:** quick local development and static-site builds.
- **Custom responsive CSS + Lucide icons:** polished UI without styling framework dependencies.
- **JSON data:** fully static deployment for zero server/database configuration.
- **Netlify:** hosting, free-tier suitability, automatic deploys after GitHub pushes, and easy preview links.

A database, authentication, or serverless API is **not needed** for this proof of concept. Profiles are publicly embedded in the built website, so only publish information volunteers explicitly agreed to share.

## Features

- Text search over names, titles, majors, co-op companies, industries, and discussion topics.
- Faculty, industry, status, and co-op company filters; combine them freely.
- Sort by featured, alphabetically, or graduation year.
- Open detailed profiles with co-op journey, advice and optionally LinkedIn.
- Save people on the current device (`localStorage`; not synchronized between devices).
- Toggle demo entries off with “Confirmed profiles only”.
- Responsive mobile layout, accessible labels, escape-to-close modal, keyboard focus styles.
- Privacy-aware CSV import tool for organizer data.

## Run locally

1. Install Node.js **20.19+ or 22.12+** and Git.
2. Open a terminal in the extracted project folder.
3. Run:

```bash
npm install
npm run dev
```

4. Open the localhost address printed by Vite (usually `http://localhost:5173/`).
5. Test production compilation with `npm run build`, and optionally `npm run preview`.

## Deploy with GitHub + Netlify (recommended)

### A. Upload to GitHub

1. Create a **new GitHub repository** named `totem-networking-night`. Choose **Private** if you only want organizers seeing the source. Leave README/`.gitignore` unchecked (they already exist).
2. From the project directory, run (replace `YOUR_USERNAME`):

```bash
git init
git add .
git commit -m "Build networking night directory prototype"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/totem-networking-night.git
git push -u origin main
```

Use GitHub's sign-in or personal access token if prompted. Alternatively, upload the extracted files using GitHub's **Add file → Upload files** interface (the project folder contents, not the ZIP itself).

### B. Deploy through Netlify

1. Log in at **https://app.netlify.com/**.
2. Choose **Add new project → Import an existing project** (wording may vary).
3. Select **GitHub**, authorize Netlify access to the repository, then choose `totem-networking-night`.
4. Confirm build command **`npm run build`** and publish directory **`dist`**. The included `netlify.toml` normally detects these automatically.
5. Click **Deploy**. Netlify will give you a `https://...netlify.app` URL to share with the organizers.
6. Optional: **Site configuration → Change site name** to something memorable (availability permitting).

Every subsequent push to `main` automatically triggers a new Netlify deploy. GitHub PRs can also receive Deploy Previews depending on Netlify plan/settings. If the repository is private, **the deployed website is still public by default** unless you configure site-level access controls.

### C. Iterate with organizers

Make edits locally, verify with `npm run dev`, then:

```bash
git add .
git commit -m "Update guest profiles and event content"
git push
```

Share the Netlify URL for mobile testing and organizer feedback.

## Replace examples with real professional profiles

Your master CSV headers should match the `sample-profiles.csv` example. Fill in the original template and ensure the **Website Profile Consent *** column says `Yes — publish my profile` for each person being shown.

Run:

```bash
python3 scripts/import_profiles.py /path/to/new-responses.csv
```

This replaces existing real profiles with new consenting responses and **keeps the 16 fictional profiles**, clearly labeled. When you are ready for the real event, use:

```bash
python3 scripts/import_profiles.py /path/to/new-responses.csv --no-demo
npm run build
git add src/data/profiles.json
git commit -m "Publish consented guest directory"
git push
```

**Important:** Do not commit the raw responses CSV once it contains sensitive/private details. Only commit the generated `src/data/profiles.json` after reviewing it. Organizer notes and consent columns are excluded from generated public JSON. The `sample-profiles.csv` file is an initial demo file containing the profile supplied for this proof of concept; delete it from the repo if you no longer wish to keep a copy of that provided input.

### Useful current input fields

The converter reads: Full Name, Display Name, Current Status, Current Title / Role, Current Organization, UBC Faculty, Major / Program, Graduation Year, Co-op / Internship Companies, Co-op / Internship Roles, Primary Industry, Other Industries / Interests, One line advice, LinkedIn, Website Profile Consent, LinkedIn Display Consent. It also accepts an optional `Topics I Can Discuss` column to allow richer topic filtering.

**Co-op lists:** separate companies and roles with commas or semicolons, in corresponding order. Multi-valued entries, such as organization names containing commas, should be adjusted in the source CSV before importing.

## Privacy and readiness checks before public launch

- Get clear permission from each person to publish their name, role, company history, degree and other profile details. The existing CSV consent field is used as a gate.
- LinkedIn is included **only** when separate LinkedIn display consent is affirmative.
- Remove placeholders via `--no-demo`, and review every generated entry for accuracy.
- Never upload attendee lists, personal emails, phone numbers, or organizer notes into a public Git repository or frontend JSON.
- The website is a public directory, **not** an RSVP system, access-controlled portal, or live guest check-in tool.
- Dates/venue are currently hard-coded into the frontend. Change them in `src/App.tsx` if the event changes.
- Do not imply fictional examples are real confirmed attendees in promotion or printed materials.

## Project layout

```
src/
  App.tsx                 # UI, filters, cards, modal, favorites
  styles.css              # Responsive visual design
  data/profiles.json      # Public-facing profile dataset
scripts/import_profiles.py # Import consenting CSV entries
sample-profiles.csv       # Original one-row sample data (demo only)
netlify.toml              # Production build and SPA fallback
```

## Possible next version

Organizer-facing admin form, submitted profile approvals, Airtable/Supabase for updates without rebuilding, QR codes by faculty, event floor map, and optional anonymous visitor feedback. Those features need additional privacy/maintenance decisions, so they are intentionally not in the proof of concept.

---

## Self-service guest registration (new)

The **Add my profile** section at the bottom lets professionals submit the original spreadsheet-style fields directly; approved-by-the-submitter public fields appear automatically in the live directory, without a GitHub commit. An optional JPEG/PNG/WebP profile photo is displayed in cards and the profile modal. The front-end still contains 16 clearly marked sample profiles. The server uses **Netlify Functions + Netlify Blobs** to store each submitted profile and photo independently, across redeploys. It does not change the original Excel/CSV file: the spreadsheet is an import source, while Netlify is the live source of submissions.

### Important: enable the form safely

1. Deploy to **Netlify** as described above. Ordinary `vite` development runs only the UI, not Netlify Functions; use `npx netlify dev` to test live APIs locally after Netlify is connected.
2. Create a free **Cloudflare Turnstile** widget at https://dash.cloudflare.com/ (Turnstile), add your deployed Netlify domain as a valid hostname, and copy the **site key** and **secret key**. Create a separate testing widget if needed.
3. In **Netlify → Project configuration → Environment variables**, add these as **site environment variables** (not in GitHub, not `VITE_` variables):

   | Name | Value | Purpose |
   |---|---|---|
   | `SUBMISSIONS_OPEN` | `true` | Enables the public profile submission API |
   | `TURNSTILE_SITE_KEY` | Your public Turnstile site key | Shows anti-bot widget |
   | `TURNSTILE_SECRET_KEY` | Your private Turnstile secret | Server verifies challenge token |
   | `ADMIN_REMOVE_TOKEN` | A strong random secret (32+ random bytes, hex) | Authorizes guest removal |

4. Redeploy your Netlify site after adding or changing variables. The website gets its configuration from `/api/config`. Test with a profile and an optional image; check it appears after a refresh (including another browser). Note: submissions are **automatically published** once validation and Turnstile succeed, with no organizer review. Only enable this if you are comfortable with that behavior.
5. **Close the form before the event:** change `SUBMISSIONS_OPEN` to `false` in Netlify environment variables and redeploy. The server enforces read-only behavior (including direct HTTP requests); existing profiles remain available. If credentials are not configured, the form defaults to closed.

For production and deploy previews, submitted data uses separate Netlify Blobs stores. **Do not store private contact information or internal notes** in the public form. Visitors explicitly consent to publishing and separately to displaying a LinkedIn link. The application does not ask for private emails or telephone numbers.

### Removing a submission

Find the submitted ID from `GET https://YOUR-DOMAIN/api/profiles` (e.g. `submitted-...`). The form is intentionally not editable by the public after submission. An organizer can delete a submitted entry **and its photo** using the authenticated endpoint:

```bash
curl -X DELETE 'https://YOUR-DOMAIN/api/remove-profile' \
  -H 'Origin: https://YOUR-DOMAIN' \
  -H 'Content-Type: application/json' \
  -H "Authorization: Bearer $ADMIN_REMOVE_TOKEN" \
  --data '{"id":"submitted-REPLACE-WITH-UUID"}'
```

Never put `ADMIN_REMOVE_TOKEN` in browser JavaScript, committed `.env` files, or a public repository. You can also stop accepting submissions at any time. The original organizer-provided profile and generated demos are part of the checked-in static JSON and must be edited or removed in that JSON if necessary.

### Basic security checks completed

Run `npm test` for checks of publication consent, LinkedIn consent and link allowlisting, text sanitization/length caps, image signature checking, and origin checks. Other defenses: server-side Turnstile verification, a honeypot, 1.5 MB image cap, accepted image-type restrictions (no SVG), server-stored admin secret, no public write endpoint when closed, browser security headers, server stripping of unrecognized/private fields, and safe React text rendering (no `dangerouslySetInnerHTML`).

**Limitations:** This is a POC, not a security-certified service. Automatic public publishing may allow malicious or impersonating submissions from humans who solve Turnstile; organizers must review the directory periodically and promptly respond to removal requests. Uploaded images are file-signature checked but not virus-scanned or independently resized/re-encoded. If the event gains significant traffic, add email verification or a moderation queue, image processing, stronger rate limits and an admin console. Netlify Blobs is key/value storage suited to a small event; it is not a transactional database. Avoid exposing your secrets or any real guest information in public GitHub commits.
