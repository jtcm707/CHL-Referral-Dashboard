/* =========================================================================
   db.js — the ONLY place that talks to Supabase.
   -------------------------------------------------------------------------
   Every database read/write for the dashboard goes through a function here.
   Pages (dashboard.js, contact.js) never call Supabase directly. That keeps
   data access in one testable place and makes adding Authentication later a
   small, contained change (see the AUTH section at the bottom).

   Exposes a global `DB` object:
     DB.ready                         -> boolean, is Supabase configured?
     DB.STATUSES                      -> the list of valid status values
     DB.generateReferralId(dateStr)   -> "CHT-YYYYMMDD-XXXXX"
     DB.fetchReferrals()              -> Promise<referral[]>  (newest first)
     DB.fetchReferralById(id)         -> Promise<referral|null>
     DB.updateStatus(id, status)      -> Promise<referral>
     DB.updateNotes(id, notes)        -> Promise<referral>
     DB.updateSaleVerified(id, bool)  -> Promise<referral>
     DB.backfillReferralCode(id,code) -> Promise<referral>
   All functions throw on error; callers use try/catch.
   ========================================================================= */
(function () {
  'use strict';

  var CONFIG = window.CHT_CONFIG || {};

  var READY =
    !!CONFIG.SUPABASE_URL &&
    !!CONFIG.SUPABASE_ANON_KEY &&
    CONFIG.SUPABASE_URL !== 'YOUR_SUPABASE_URL' &&
    CONFIG.SUPABASE_ANON_KEY !== 'YOUR_SUPABASE_ANON_KEY';

  // The global `supabase` comes from the CDN script loaded in each HTML page.
  var client =
    READY && window.supabase
      ? window.supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_ANON_KEY)
      : null;

  if (!READY) {
    console.warn(
      'Supabase is not configured. Fill in config.js with your project URL ' +
        'and publishable key. The dashboard cannot load data until then.'
    );
  }

  var STATUSES = [
    'New',
    'Contacted',
    'Appointment Booked',
    'Sale Completed',
    'Invalid',
    'Closed',
  ];

  var TABLE = 'referrals';

  // ---- Referral ID -------------------------------------------------------
  // Format: CHT-YYYYMMDD-XXXXX  (matches the database trigger). The database
  // assigns codes automatically on insert; this JS version is only used to
  // backfill any legacy row that somehow still lacks one.
  var ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'; // no 0/O/1/I/L

  function suffix(len) {
    var out = '';
    for (var i = 0; i < len; i++) {
      out += ALPHABET.charAt(Math.floor(Math.random() * ALPHABET.length));
    }
    return out;
  }

  function generateReferralId(isoDate) {
    var d = isoDate ? new Date(isoDate) : new Date();
    if (isNaN(d.getTime())) d = new Date();
    var y = d.getFullYear();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return 'CHT-' + y + m + day + '-' + suffix(5);
  }

  // ---- Helpers -----------------------------------------------------------
  function assertReady() {
    if (!client) {
      throw new Error(
        'Supabase is not configured. Check config.js (project URL + publishable key).'
      );
    }
  }

  function throwIf(error, context) {
    if (error) {
      console.error(context + ':', error);
      var e = new Error(error.message || 'Database error');
      e.code = error.code;
      e.original = error;
      throw e;
    }
  }

  // ---- Reads -------------------------------------------------------------
  async function fetchReferrals() {
    assertReady();
    var res = await client
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false }); // newest first
    throwIf(res.error, 'fetchReferrals');
    return res.data || [];
  }

  async function fetchReferralById(id) {
    assertReady();
    var res = await client.from(TABLE).select('*').eq('id', id).maybeSingle();
    throwIf(res.error, 'fetchReferralById');
    return res.data || null;
  }

  // ---- Writes ------------------------------------------------------------
  async function updateFields(id, fields) {
    assertReady();
    var res = await client
      .from(TABLE)
      .update(fields)
      .eq('id', id)
      .select()
      .single();
    throwIf(res.error, 'update ' + Object.keys(fields).join(','));
    return res.data;
  }

  function updateStatus(id, status) {
    if (STATUSES.indexOf(status) === -1) {
      return Promise.reject(new Error('Invalid status: ' + status));
    }
    return updateFields(id, { status: status });
  }

  function updateNotes(id, notes) {
    return updateFields(id, { notes: notes });
  }

  function updateSaleVerified(id, verified) {
    return updateFields(id, { sale_verified: !!verified });
  }

  function backfillReferralCode(id, code) {
    return updateFields(id, { referral_code: code });
  }

  // ---- Public surface ----------------------------------------------------
  window.DB = {
    ready: READY,
    STATUSES: STATUSES,
    generateReferralId: generateReferralId,
    fetchReferrals: fetchReferrals,
    fetchReferralById: fetchReferralById,
    updateStatus: updateStatus,
    updateNotes: updateNotes,
    updateSaleVerified: updateSaleVerified,
    backfillReferralCode: backfillReferralCode,
  };

  /* -----------------------------------------------------------------------
     AUTH — how to lock this down later (no page changes needed)
     -----------------------------------------------------------------------
     1. In the Supabase dashboard, enable an auth provider (email is simplest)
        and create a login account for each staff member.
     2. Change the two RLS policies in supabase/dashboard-migration.sql from
          to anon, authenticated
        to
          to authenticated
        and re-run that file.
     3. Add a sign-in gate. A skeleton lives in index.html. The helpers below
        are already here so the rest of the app keeps working unchanged:

          DB.getCurrentUser = async function () {
            var r = await client.auth.getUser();
            return r.data ? r.data.user : null;
          };
          DB.signIn = function (email, password) {
            return client.auth.signInWithPassword({ email: email, password: password });
          };
          DB.signOut = function () { return client.auth.signOut(); };

     Because every query already runs through db.js, you only wire auth in one
     place — no changes to dashboard.js or contact.js.
     --------------------------------------------------------------------- */
})();
