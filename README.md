# Christian Hearing & Tinnitus — Referral Dashboard

Everything is in ONE file: **index.html**. It contains the whole dashboard —
styling, logo, the referral table, the contact page, all logic, and your
Supabase keys. There are no other files to load, so nothing can get out of sync.

## What's in this zip
- `index.html` — the entire dashboard (this is all the website needs)
- `supabase/dashboard-migration.sql` — run once in Supabase (see below)
- `README.md` — this file

You can safely DELETE these old files from your repo if they're still there:
`dashboard.html`, `contact.html`, `styles.css`, `config.js`, `db.js`,
`script.js`, `dashboard.js`, `contact.js`, and the `assets/` folder. The single
`index.html` replaces all of them.

## Deploy (do this exactly)
1. In your GitHub repo, open the current `index.html` and DELETE it
   (trash icon → Commit changes). This clears the old, broken file.
2. Click **Add file → Upload files**.
3. Drag in **only** the new `index.html` from this zip. Do not open it, do not
   copy-paste its contents.
4. At the commit step, choose **"Commit directly to the main branch"**
   (NOT "Create a new branch"). Commit.
5. In Cloudflare → your Pages project → **Deployments**, confirm a NEW
   deployment appears. When it says Success, open your site and hard-refresh
   (Ctrl+Shift+R / Cmd+Shift+R).

The one rule that keeps this working: upload the real file by dragging it —
never hand-create a file and paste code into it.

## Database (one-time)
If the dashboard loads but says the table isn't set up, or shows no data:
1. Supabase → **SQL Editor → New query**.
2. Paste all of `supabase/dashboard-migration.sql`, click **Run**.
3. Make sure you run it on the SAME project whose keys are in `index.html`
   (project ref `eeejjoxwheydrrwdasph`) and the same project your landing page
   saves to.

## Email template
The contact page's "Send email" uses your referral-confirmation script. The
recipient's name fills in after "Dear", and the referral's ID fills in on the
"Your Referral ID:" line — both automatically. Staff can edit any of it before
sending, and "Reset to template" restores it.

## Keys
Your Supabase URL and publishable key are already in `index.html` near the
bottom, inside `window.CHT_CONFIG`. Both are public and safe in browser code.
Never add the service_role (secret) key.
