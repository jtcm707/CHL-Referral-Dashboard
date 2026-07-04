/* =========================================================================
   script.js — small shared helpers used by both pages.
   Exposes a global `UI` object. No framework, plain browser JS.
   ========================================================================= */
(function () {
  'use strict';

  // Footer year, if present.
  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // ---- Escaping (prevent HTML injection from stored data) ----------------
  function escapeHtml(value) {
    if (value === null || value === undefined) return '';
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // ---- Formatting --------------------------------------------------------
  function formatDate(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  }

  function shortId(id) {
    if (!id) return '—';
    var s = String(id);
    return s.length > 10 ? s.slice(0, 8) + '…' : s;
  }

  function telHref(phone) {
    if (!phone) return '';
    return 'tel:' + String(phone).replace(/[^\d+]/g, '');
  }

  // ---- Toast -------------------------------------------------------------
  var toastEl = null;
  var toastTimer = null;

  function toast(message, kind) {
    if (!toastEl) {
      toastEl = document.createElement('div');
      toastEl.className = 'toast';
      toastEl.setAttribute('role', 'status');
      toastEl.setAttribute('aria-live', 'polite');
      document.body.appendChild(toastEl);
    }
    toastEl.textContent = message;
    toastEl.className = 'toast toast--' + (kind || 'info') + ' is-visible';
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.className = 'toast';
    }, 2600);
  }

  // ---- Copy to clipboard (with fallback) ---------------------------------
  async function copy(text, label) {
    var value = text == null ? '' : String(text);
    if (!value) {
      toast('Nothing to copy', 'error');
      return false;
    }
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(value);
      } else {
        var ta = document.createElement('textarea');
        ta.value = value;
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      toast((label ? label : 'Value') + ' copied', 'success');
      return true;
    } catch (err) {
      console.error('copy failed', err);
      toast('Could not copy', 'error');
      return false;
    }
  }

  window.UI = {
    escapeHtml: escapeHtml,
    formatDate: formatDate,
    shortId: shortId,
    telHref: telHref,
    toast: toast,
    copy: copy,
  };
})();
