/* =========================================================================
   Public front-end configuration  (Admin Dashboard)
   -------------------------------------------------------------------------
   These MUST be the exact same two values your LANDING PAGE uses, because the
   dashboard reads and writes the same Supabase project.

   Copy them from:  Supabase dashboard -> Project Settings -> API
     • Project URL          -> SUPABASE_URL
     • publishable / anon key -> SUPABASE_ANON_KEY   (starts with sb_publishable_ or eyJ...)

   Both are PUBLIC keys and are meant to live in browser code. NEVER put the
   service_role (secret) key here — it bypasses all security.

   ⚠️  If your landing page's live /config.js shows a DIFFERENT project URL than
   the one below (for example if the URL was corrected after a typo), use that
   working URL here too — the dashboard and landing page must point at the SAME
   project reference.
   ========================================================================= */
window.CHT_CONFIG = {
  SUPABASE_URL: 'https://eeejjoxwheydrrwdasph.supabase.co',
  SUPABASE_ANON_KEY: 'sb_publishable_lYqknXA6GFgMEZWRGEinkA_SEI1norq',
};
