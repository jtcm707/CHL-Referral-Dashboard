# Christian Hearing & Tinnitus — Referral Admin Dashboard

A two-page internal dashboard that reads and manages the referrals submitted by
the existing landing page. It uses the **same Supabase project** as the landing
page and is built as plain static files (HTML, CSS, JavaScript) — no build step.

- **Dashboard (`dashboard.html`)** — a sortable, searchable table of every
  referral, with inline status editing, sale verification, and copy buttons.
- **Contact (`contact.html`)** — opens for a single referral so staff can call,
  email (pre-filled), copy details, change status, and save notes.

---

## Project structure

```
index.html                 Entry point → forwards to the dashboard (future login gate)
dashboard.html             Page 1 — the referral table
contact.html               Page 2 — contact a single referral
styles.css                 Shared styling (matches the landing page brand)
config.js                  Your Supabase URL + publishable key  ← you edit this
db.js                      All Supabase reads/writes live here (reusable layer)
script.js                  Shared UI helpers (copy, toast, formatting)
dashboard.js               Page 1 logic
contact.js                 Page 2 logic
_headers                   Cloudflare Pages headers (noindex, caching)
assets/                    Logos and favicons
supabase/
  dashboard-migration.sql  Run ONCE in Supabase to prepare the table
README.md                  This file
```

Database access is deliberately isolated in **`db.js`**. Pages never call
Supabase directly — they call `DB.fetchReferrals()`, `DB.updateStatus()`, and so
on. This keeps the app easy to maintain and makes adding authentication a small,
one-place change.

---

## 1. Connect to the existing Supabase project

The dashboard must point at the **same** Supabase project your landing page
already writes to. You need two values from that project.

1. Open the Supabase dashboard and select the project the landing page uses.
2. Go to **Project Settings → API**.
3. Copy the **Project URL** and the **publishable / anon** key.

Then run the one-time database migration so the table has the columns the
dashboard needs (`referral_code`, `status`, `notes`, `sale_verified`) and so the
dashboard is allowed to read and update rows:

1. Supabase dashboard → **SQL Editor → New query**.
2. Open `supabase/dashboard-migration.sql`, copy **all** of it, paste, **Run**.
3. Confirm success, then open **Table Editor → referrals** and check the new
   columns exist. Existing rows will now show a `referral_code`.

The migration is safe to run more than once.

> **Referral IDs** look like `CHT-20260704-A8F3K` (date + 5 characters). The
> migration adds a trigger so **every new referral gets one automatically**, and
> it backfills any older rows. These IDs are permanent and never change — staff
> use them to verify sales.

---

## 2. What goes into `config.js`

Open `config.js` and paste your two values:

```js
window.CHT_CONFIG = {
  SUPABASE_URL: 'https://YOUR-PROJECT-ref.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_xxxxxxxxxxxxxxxxxxxx',
};
```

- Both are **public** keys and are meant to live in browser code.
- **Never** put the `service_role` (secret) key here — it bypasses all security.
- The URL and key **must match** the ones your landing page uses. If your
  landing page's live `/config.js` shows a different (corrected) project URL,
  use that exact URL here too.

---

## 3. Deploy on Cloudflare Pages

This is a no-build static site, so the settings are minimal.

1. Push these files to a GitHub repo. Upload the **individual files and folders**
   (`index.html`, `dashboard.html`, `contact.html`, `styles.css`, `config.js`,
   `db.js`, `script.js`, `dashboard.js`, `contact.js`, `_headers`, `assets/`,
   `supabase/`) so `index.html` sits at the **top level** of the repo — not
   nested inside a folder.
2. Cloudflare dashboard → **Workers & Pages → Create → Pages → Connect to Git**,
   and pick the repo.
3. Set the build settings to:
   - **Framework preset:** None
   - **Build command:** *(leave blank)*
   - **Build output directory:** `/`
   - **Root directory:** *(leave blank)*
4. **Save and Deploy.** Cloudflare redeploys automatically on every push.

To change your keys later, edit `config.js` on GitHub and commit — the `_headers`
file tells Cloudflare not to cache `config.js`, so changes go live on the next
page load (hard-refresh with Ctrl/Cmd+Shift+R if needed).

---

## 4. Test the dashboard

1. Open your Pages URL. `index.html` forwards to `dashboard.html`.
2. You should see the referrals table load. Try:
   - **Search** by a name, phone number, or Referral ID.
   - **Filter by status** with the dropdown.
   - **Sort** by clicking a column header (Submitted is newest-first by default).
   - **Copy** a Referral ID, phone, or email with the small copy icons.
   - **Click a row** to open the contact page for that referral.
3. On the contact page, try **Call**, **Send email** (opens your mail app with
   the message pre-filled), and **Copy** buttons.

If the table is empty but you know referrals exist, submit a test referral from
the landing page and refresh.

---

## 5. Verify updates are written back to Supabase

Every status change, sale-verification toggle, and saved note writes to Supabase
immediately.

1. On the dashboard, change a row's **Status** dropdown, or flip **Sale
   Verified**. You'll see a brief "updated" confirmation.
2. In the Supabase **Table Editor → referrals**, refresh — the `status` /
   `sale_verified` value for that row now matches what you set.
3. On the contact page, type in **Notes** and click **Save notes**, then confirm
   the `notes` column updated in the Table Editor.

If a change fails, the control reverts and shows an error message — nothing is
left in a misleading state.

---

## 6. Troubleshooting

**"Supabase isn't configured."**
`config.js` still has placeholder values, or the file didn't deploy. Open
`https://<your-site>.pages.dev/config.js` in the browser and confirm it shows
your real URL and key. If not, commit the corrected `config.js` and wait for the
redeploy.

**"The referrals table isn't set up for the dashboard yet."**
You haven't run `supabase/dashboard-migration.sql`. Run it in the SQL Editor,
then click **Try again**.

**"Could not reach Supabase" / network error.**
The Project URL in `config.js` is wrong or the project is paused. Copy the exact
URL from Project Settings → API, and make sure the project is active (free-tier
projects pause after inactivity and need to be resumed).

**"The Supabase key was rejected."**
The publishable key doesn't belong to this project, or has a typo. Re-copy it
from Project Settings → API. Make sure it's the **publishable/anon** key, never
the service_role key.

**Table loads but is empty.**
There are no referrals yet, or your **status filter/search** is hiding them.
Clear the search box and set the filter to "All statuses."

**Logos or icons don't appear.**
The `assets/` folder didn't upload. Re-upload the `assets/` folder to the repo
(binary files sometimes get skipped in GitHub's web uploader), and confirm
`https://<your-site>.pages.dev/assets/logo-icon.png` loads directly.

**Status/notes won't save.**
The update RLS policies didn't apply. Re-run `supabase/dashboard-migration.sql`,
which (re)creates the read and update policies.

---

## Security & adding staff login later

This dashboard uses only the **publishable key**, and the migration grants the
anonymous role permission to read and update referrals. That is fine for a
private, unlisted internal tool, but it is **not** real access control — anyone
who finds the URL could read the data.

When you're ready to lock it down with **Supabase Authentication** (recommended):

1. Enable an auth provider (email is simplest) in Supabase and create a login
   for each staff member.
2. In `supabase/dashboard-migration.sql`, change `to anon, authenticated` to
   `to authenticated` in the two dashboard policies, and re-run the file.
3. Add a sign-in screen. `index.html` is the intended home for it, and `db.js`
   already contains an `AUTH` section with the helper functions you'll need.

Because **all** database access already flows through `db.js`, wiring in auth
touches one place — `dashboard.js` and `contact.js` don't change.
