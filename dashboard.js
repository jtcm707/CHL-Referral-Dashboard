/* =========================================================================
   dashboard.js — Page 1 logic.
   Talks to Supabase only through the DB layer (db.js) and uses shared UI
   helpers (script.js). No framework.
   ========================================================================= */
(function () {
  'use strict';

  var el = {
    loading:   document.getElementById('loadingState'),
    empty:     document.getElementById('emptyState'),
    emptyTitle:document.getElementById('emptyTitle'),
    emptyText: document.getElementById('emptyText'),
    toolbar:   document.getElementById('toolbar'),
    tableWrap: document.getElementById('tableWrap'),
    tbody:     document.getElementById('tableBody'),
    search:    document.getElementById('searchInput'),
    filter:    document.getElementById('statusFilter'),
    count:     document.getElementById('resultCount'),
    refresh:   document.getElementById('refreshBtn'),
    updated:   document.getElementById('lastUpdated'),
    errBanner: document.getElementById('errorBanner'),
    errText:   document.getElementById('errorText'),
    errRetry:  document.getElementById('errorRetry'),
    thead:     document.querySelector('#table thead'),
  };

  var state = {
    all: [],
    sortKey: 'created_at',
    sortDir: 'desc',   // 'asc' | 'desc'
    search: '',
    status: '',
  };

  // ---- View helpers ------------------------------------------------------
  function show(node) { if (node) node.hidden = false; }
  function hide(node) { if (node) node.hidden = true; }

  function setError(message) {
    el.errText.textContent = message;
    show(el.errBanner);
    hide(el.loading);
    hide(el.toolbar);
    hide(el.tableWrap);
    hide(el.empty);
  }
  function clearError() { hide(el.errBanner); }

  function statusClass(status) {
    return 'st-' + String(status || 'New').replace(/\s+/g, '');
  }

  function digits(v) { return String(v || '').replace(/\D/g, ''); }

  // ---- Filtering + sorting ----------------------------------------------
  function matchesSearch(r, q) {
    if (!q) return true;
    var needle = q.trim().toLowerCase();
    var digitNeedle = digits(q);
    var haystack = [r.your_name, r.friend_name, r.referral_code]
      .map(function (x) { return String(x || '').toLowerCase(); })
      .join(' ');
    if (haystack.indexOf(needle) !== -1) return true;
    if (digitNeedle) {
      if (digits(r.your_phone).indexOf(digitNeedle) !== -1) return true;
      if (digits(r.friend_phone).indexOf(digitNeedle) !== -1) return true;
    }
    return false;
  }

  function compare(a, b, key) {
    var av = a[key], bv = b[key];
    if (key === 'created_at') {
      return new Date(av || 0) - new Date(bv || 0);
    }
    if (key === 'sale_verified') {
      return (av ? 1 : 0) - (bv ? 1 : 0);
    }
    av = String(av == null ? '' : av).toLowerCase();
    bv = String(bv == null ? '' : bv).toLowerCase();
    return av < bv ? -1 : av > bv ? 1 : 0;
  }

  function currentView() {
    var rows = state.all.filter(function (r) {
      if (state.status && r.status !== state.status) return false;
      return matchesSearch(r, state.search);
    });
    rows.sort(function (a, b) {
      var c = compare(a, b, state.sortKey);
      return state.sortDir === 'asc' ? c : -c;
    });
    return rows;
  }

  // ---- Rendering ---------------------------------------------------------
  var copyIcon =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';

  function copyBtn(value, label) {
    if (!value) return '';
    return (
      '<button class="copybtn" type="button" data-copy="' +
      UI.escapeHtml(value) + '" data-label="' + UI.escapeHtml(label) +
      '" title="Copy ' + UI.escapeHtml(label) + '" aria-label="Copy ' +
      UI.escapeHtml(label) + '">' + copyIcon + '</button>'
    );
  }

  function statusSelect(r) {
    var opts = DB.STATUSES.map(function (s) {
      return '<option value="' + UI.escapeHtml(s) + '"' +
        (s === r.status ? ' selected' : '') + '>' + UI.escapeHtml(s) + '</option>';
    }).join('');
    return (
      '<select class="status-select ' + statusClass(r.status) +
      '" data-id="' + UI.escapeHtml(r.id) + '" data-role="status" ' +
      'aria-label="Change status">' + opts + '</select>'
    );
  }

  function saleToggle(r) {
    return (
      '<label class="toggle" title="Mark sale verified">' +
      '<input type="checkbox" data-id="' + UI.escapeHtml(r.id) +
      '" data-role="sale"' + (r.sale_verified ? ' checked' : '') + ' />' +
      '<span class="toggle__track" aria-hidden="true"></span>' +
      '<span class="toggle__label">' + (r.sale_verified ? 'Yes' : 'No') + '</span>' +
      '</label>'
    );
  }

  function emailCell(email) {
    if (!email) return '<span class="cell-muted">—</span>';
    return (
      '<span class="copychip"><a href="mailto:' + UI.escapeHtml(email) + '">' +
      UI.escapeHtml(email) + '</a>' + copyBtn(email, 'email') + '</span>'
    );
  }
  function phoneCell(phone) {
    if (!phone) return '<span class="cell-muted">—</span>';
    return (
      '<span class="copychip"><a href="' + UI.telHref(phone) + '">' +
      UI.escapeHtml(phone) + '</a>' + copyBtn(phone, 'phone') + '</span>'
    );
  }

  function rowHtml(r) {
    var notes = r.notes
      ? '<td class="cell-notes">' + UI.escapeHtml(r.notes) + '</td>'
      : '<td class="cell-notes empty">No notes</td>';

    return (
      '<tr class="row-clickable" data-id="' + UI.escapeHtml(r.id) + '">' +
        '<td><span class="copychip"><span class="cell-code">' +
          UI.escapeHtml(r.referral_code || '—') + '</span>' +
          copyBtn(r.referral_code, 'Referral ID') + '</span></td>' +
        '<td><span class="copychip"><span class="cell-muted" title="' +
          UI.escapeHtml(r.id) + '">' + UI.escapeHtml(UI.shortId(r.id)) + '</span>' +
          copyBtn(r.id, 'Row ID') + '</span></td>' +
        '<td class="cell-muted">' + UI.escapeHtml(UI.formatDate(r.created_at)) + '</td>' +
        '<td class="cell-strong">' + UI.escapeHtml(r.your_name || '—') + '</td>' +
        '<td>' + phoneCell(r.your_phone) + '</td>' +
        '<td>' + emailCell(r.your_email) + '</td>' +
        '<td class="cell-strong">' + UI.escapeHtml(r.friend_name || '—') + '</td>' +
        '<td>' + phoneCell(r.friend_phone) + '</td>' +
        '<td>' + emailCell(r.friend_email) + '</td>' +
        '<td>' + statusSelect(r) + '</td>' +
        notes +
        '<td>' + saleToggle(r) + '</td>' +
      '</tr>'
    );
  }

  function updateSortIndicators() {
    var ths = el.thead.querySelectorAll('th.sortable');
    ths.forEach(function (th) {
      var ind = th.querySelector('.sort-ind');
      if (ind) ind.remove();
      if (th.getAttribute('data-key') === state.sortKey) {
        var span = document.createElement('span');
        span.className = 'sort-ind';
        span.textContent = state.sortDir === 'asc' ? '▲' : '▼';
        th.appendChild(span);
      }
    });
  }

  function render() {
    var rows = currentView();
    updateSortIndicators();

    // Count label
    var total = state.all.length;
    el.count.textContent =
      rows.length === total
        ? total + (total === 1 ? ' referral' : ' referrals')
        : rows.length + ' of ' + total + ' shown';

    if (total === 0) {
      hide(el.tableWrap);
      el.emptyTitle.textContent = 'No referrals yet';
      el.emptyText.textContent =
        'When someone submits the referral form, it will appear here.';
      show(el.empty);
      return;
    }

    if (rows.length === 0) {
      hide(el.tableWrap);
      el.emptyTitle.textContent = 'No matches';
      el.emptyText.textContent =
        'No referrals match your search or filter. Try clearing them.';
      show(el.empty);
      return;
    }

    hide(el.empty);
    el.tbody.innerHTML = rows.map(rowHtml).join('');
    show(el.tableWrap);
  }

  // ---- Referral ID backfill (safety net) --------------------------------
  // The database trigger assigns codes on insert, so this normally does
  // nothing. If any legacy row is missing a code, generate one and persist it.
  async function backfillCodes() {
    var missing = state.all.filter(function (r) { return !r.referral_code; });
    for (var i = 0; i < missing.length; i++) {
      var r = missing[i];
      var code = DB.generateReferralId(r.created_at);
      try {
        var saved = await DB.backfillReferralCode(r.id, code);
        r.referral_code = saved.referral_code || code;
      } catch (err) {
        // If a unique collision or permission issue occurs, show the generated
        // code locally so the UI still works; it just isn't persisted.
        r.referral_code = code;
      }
    }
  }

  // ---- Data load ---------------------------------------------------------
  async function load() {
    clearError();
    show(el.loading);
    hide(el.toolbar);
    hide(el.tableWrap);
    hide(el.empty);

    if (!DB.ready) {
      hide(el.loading);
      setError(
        'Supabase isn\u2019t configured. Open config.js and fill in your project ' +
        'URL and publishable key (the same ones your landing page uses).'
      );
      return;
    }

    try {
      state.all = await DB.fetchReferrals();
      await backfillCodes();
      hide(el.loading);
      show(el.toolbar);
      el.updated.textContent =
        'Updated ' + new Date().toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
      render();
    } catch (err) {
      hide(el.loading);
      var msg = err && err.message ? err.message : 'Unknown error.';
      if (/relation|does not exist|schema cache|column/i.test(msg)) {
        msg = 'The referrals table isn\u2019t set up for the dashboard yet. Run ' +
              'supabase/dashboard-migration.sql in the Supabase SQL editor, then retry.';
      } else if (/Failed to fetch|NetworkError|ERR_NAME_NOT_RESOLVED/i.test(msg)) {
        msg = 'Could not reach Supabase. Check that the project URL in config.js ' +
              'is correct and the project is active, then retry.';
      } else if (/JWT|api key|Invalid/i.test(msg)) {
        msg = 'The Supabase key was rejected. Confirm the publishable key in ' +
              'config.js belongs to this project, then retry.';
      }
      setError(msg);
    }
  }

  // ---- Events ------------------------------------------------------------
  el.search.addEventListener('input', function (e) {
    state.search = e.target.value;
    render();
  });
  el.filter.addEventListener('change', function (e) {
    state.status = e.target.value;
    render();
  });
  el.refresh.addEventListener('click', load);
  el.errRetry.addEventListener('click', load);

  // Sorting
  el.thead.addEventListener('click', function (e) {
    var th = e.target.closest('th.sortable');
    if (!th) return;
    var key = th.getAttribute('data-key');
    if (state.sortKey === key) {
      state.sortDir = state.sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      state.sortKey = key;
      state.sortDir = key === 'created_at' ? 'desc' : 'asc';
    }
    render();
  });

  // Row interactions (delegated)
  el.tbody.addEventListener('click', function (e) {
    // Copy buttons
    var cb = e.target.closest('.copybtn');
    if (cb) {
      e.stopPropagation();
      UI.copy(cb.getAttribute('data-copy'), cb.getAttribute('data-label'));
      return;
    }
    // Ignore clicks on the interactive controls
    if (e.target.closest('.status-select') || e.target.closest('.toggle') ||
        e.target.closest('a')) {
      return;
    }
    // Otherwise open the contact page for this row
    var tr = e.target.closest('tr.row-clickable');
    if (tr) {
      window.location.href = 'contact.html?id=' + encodeURIComponent(tr.getAttribute('data-id'));
    }
  });

  // Status change (delegated)
  el.tbody.addEventListener('change', async function (e) {
    var target = e.target;
    var id = target.getAttribute('data-id');
    var role = target.getAttribute('data-role');
    if (!id || !role) return;

    if (role === 'status') {
      var newStatus = target.value;
      var prev = findLocal(id) ? findLocal(id).status : null;
      target.className = 'status-select ' + statusClass(newStatus);
      try {
        var saved = await DB.updateStatus(id, newStatus);
        applyLocal(id, saved);
        UI.toast('Status updated', 'success');
      } catch (err) {
        target.value = prev; // revert
        target.className = 'status-select ' + statusClass(prev);
        UI.toast('Could not update status', 'error');
      }
    }

    if (role === 'sale') {
      var verified = target.checked;
      var label = target.parentNode.querySelector('.toggle__label');
      if (label) label.textContent = verified ? 'Yes' : 'No';
      try {
        var savedS = await DB.updateSaleVerified(id, verified);
        applyLocal(id, savedS);
        UI.toast(verified ? 'Marked sale verified' : 'Sale verification cleared', 'success');
      } catch (err) {
        target.checked = !verified; // revert
        if (label) label.textContent = !verified ? 'Yes' : 'No';
        UI.toast('Could not update sale verification', 'error');
      }
    }
  });

  function findLocal(id) {
    for (var i = 0; i < state.all.length; i++) {
      if (String(state.all[i].id) === String(id)) return state.all[i];
    }
    return null;
  }
  function applyLocal(id, saved) {
    var r = findLocal(id);
    if (r && saved) Object.keys(saved).forEach(function (k) { r[k] = saved[k]; });
  }

  // Go
  load();
})();
