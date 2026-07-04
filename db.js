<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="robots" content="noindex, nofollow" />
  <title>Referral Dashboard | Christian Hearing &amp; Tinnitus</title>

  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link
    href="https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;500;600;700&family=Source+Serif+4:opsz,wght@8..60,600;8..60,700&display=swap"
    rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  <link rel="icon" type="image/png" sizes="32x32" href="assets/favicon-32.png" />
  <link rel="icon" type="image/png" sizes="16x16" href="assets/favicon-16.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="assets/apple-touch-icon.png" />
</head>
<body>
  <!-- ============================= APP BAR ============================= -->
  <header class="appbar">
    <div class="container appbar__inner">
      <div class="brand">
        <img class="brand__mark" src="assets/logo-icon.png" alt="" aria-hidden="true"
             width="40" height="40" />
        <span class="brand__name">
          Christian Hearing <span class="brand__amp">&amp;</span> Tinnitus
        </span>
      </div>
      <span class="appbar__divider" aria-hidden="true"></span>
      <p class="appbar__title">Referral Dashboard</p>
      <span class="appbar__meta" id="lastUpdated"></span>
    </div>
  </header>

  <main class="page">
    <div class="container">
      <div class="page__head">
        <div>
          <h1 class="page__title">Referrals</h1>
          <p class="page__sub">Every referral submitted from the landing page. Refresh to pull the latest.</p>
        </div>
        <button class="btn btn--primary" id="refreshBtn" type="button">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/></svg>
          Refresh
        </button>
      </div>

      <!-- Error banner (hidden unless something fails) -->
      <div class="banner banner--error" id="errorBanner" hidden>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
        <div>
          <strong>Couldn't load referrals</strong>
          <span id="errorText">Something went wrong reaching Supabase.</span>
        </div>
        <button class="btn btn--sm" id="errorRetry" type="button">Try again</button>
      </div>

      <!-- Toolbar -->
      <div class="toolbar" id="toolbar" hidden>
        <div class="toolbar__search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input id="searchInput" type="search" autocomplete="off"
                 placeholder="Search by name, phone, or Referral ID…"
                 aria-label="Search referrals" />
        </div>
        <div class="toolbar__field">
          <label for="statusFilter">Status</label>
          <select class="select" id="statusFilter" aria-label="Filter by status">
            <option value="">All statuses</option>
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Appointment Booked">Appointment Booked</option>
            <option value="Sale Completed">Sale Completed</option>
            <option value="Invalid">Invalid</option>
            <option value="Closed">Closed</option>
          </select>
        </div>
        <span class="toolbar__count" id="resultCount"></span>
      </div>

      <!-- Table -->
      <div class="table-wrap" id="tableWrap" hidden>
        <div class="table-scroll">
          <table class="data" id="table">
            <thead>
              <tr>
                <th class="sortable" data-key="referral_code">Referral ID</th>
                <th class="sortable" data-key="id">Row ID</th>
                <th class="sortable" data-key="created_at">Submitted</th>
                <th class="sortable" data-key="your_name">Referrer</th>
                <th>Referrer Phone</th>
                <th>Referrer Email</th>
                <th class="sortable" data-key="friend_name">Referred Person</th>
                <th>Referred Phone</th>
                <th>Referred Email</th>
                <th class="sortable" data-key="status">Status</th>
                <th>Notes</th>
                <th class="sortable" data-key="sale_verified">Sale Verified</th>
              </tr>
            </thead>
            <tbody id="tableBody"></tbody>
          </table>
        </div>
      </div>

      <!-- Loading state -->
      <div class="table-wrap" id="loadingState">
        <div class="state">
          <div class="spinner" aria-hidden="true"></div>
          <p class="state__title">Loading referrals…</p>
          <p>Fetching the latest data from Supabase.</p>
        </div>
      </div>

      <!-- Empty state -->
      <div class="table-wrap" id="emptyState" hidden>
        <div class="state">
          <svg class="state__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><line x1="9" y1="15" x2="15" y2="15"/></svg>
          <p class="state__title" id="emptyTitle">No referrals yet</p>
          <p id="emptyText">When someone submits the referral form, it will appear here.</p>
        </div>
      </div>
    </div>
  </main>

  <footer class="foot">
    <div class="container foot__inner">
      <span>&copy; <span id="year"></span> Christian Hearing &amp; Tinnitus — internal use only.</span>
      <img src="assets/logo-icon.png" alt="" aria-hidden="true" />
    </div>
  </footer>

  <!-- Supabase client (v2) -> config -> data layer -> shared UI -> page logic -->
  <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
  <script src="config.js"></script>
  <script src="db.js"></script>
  <script src="script.js"></script>
  <script src="dashboard.js"></script>
</body>
</html>
