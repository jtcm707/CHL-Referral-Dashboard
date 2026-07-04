/* =========================================================================
   contact.js — Page 2 logic.
   Loads one referral (by ?id=) and lets staff contact them: call, email
   (pre-filled), copy details, change status, and save notes. All writes go
   through db.js.
   ========================================================================= */
(function () {
  'use strict';

  // The Referral ID is woven into the template and guaranteed on send.
  function defaultSubject() {
    return 'Your Christian Hearing & Tinnitus Referral';
  }

  function defaultBody(recipientName, code) {
    var greeting = recipientName ? 'Hello ' + recipientName + ',' : 'Hello,';
    return [
      greeting,
      '',
      'Thank you for participating in our referral program.',
      '',
      'We received your referral and would like to schedule your appointment.',
      '',
      'To claim your reward, please use your Referral ID: ' + code,
      '',
      'Please reply to this email or call us at your convenience.',
      '',
      'Thank you,',
      'Christian Hearing & Tinnitus',
    ].join('\n');
  }

  // Tracks whether the staff member has edited the fields (so switching the
  // recipient doesn't wipe their custom wording).
  var emailPristine = true;

  var el = {
    loading:  document.getElementById('loadingState'),
    content:  document.getElementById('content'),
    errBanner:document.getElementById('errorBanner'),
    errText:  document.getElementById('errorText'),

    refCode:  document.getElementById('refCode'),
    rowId:    document.getElementById('rowId'),
    copyCode: document.getElementById('copyCode'),

    referrerName:  document.getElementById('referrerName'),
    referrerPhone: document.getElementById('referrerPhone'),
    referrerEmail: document.getElementById('referrerEmail'),
    referrerPhoneActions: document.getElementById('referrerPhoneActions'),
    referrerEmailActions: document.getElementById('referrerEmailActions'),
    contactMethod: document.getElementById('contactMethod'),

    friendName:  document.getElementById('friendName'),
    friendPhone: document.getElementById('friendPhone'),
    friendEmail: document.getElementById('friendEmail'),
    friendPhoneActions: document.getElementById('friendPhoneActions'),
    friendEmailActions: document.getElementById('friendEmailActions'),
    submitted:   document.getElementById('submitted'),

    notes:     document.getElementById('notes'),
    saveNotes: document.getElementById('saveNotes'),
    status:    document.getElementById('statusSelect'),

    callReferrer: document.getElementById('callReferrer'),
    callFriend:   document.getElementById('callFriend'),
    sendEmail:    document.getElementById('sendEmail'),
    emailTarget:  document.getElementById('emailTarget'),
    emailSubject: document.getElementById('emailSubject'),
    emailBody:    document.getElementById('emailBody'),
    resetEmail:   document.getElementById('resetEmail'),
    codeHint:     document.getElementById('codeHint'),
    copyEmail:    document.getElementById('copyEmail'),
    copyPhone:    document.getElementById('copyPhone'),
  };

  var referral = null;

  function getId() {
    var params = new URLSearchParams(window.location.search);
    return params.get('id');
  }

  function showError(msg) {
    el.errText.textContent = msg;
    el.errBanner.hidden = false;
    el.loading.hidden = true;
    el.content.hidden = true;
  }

  // Small copy button appended to a field's actions cell.
  function addCopyButton(container, value, label) {
    if (!value) return;
    var btn = document.createElement('button');
    btn.className = 'copybtn';
    btn.type = 'button';
    btn.title = 'Copy ' + label;
    btn.setAttribute('aria-label', 'Copy ' + label);
    btn.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>';
    btn.addEventListener('click', function () { UI.copy(value, label); });
    container.appendChild(btn);
  }

  function setContact(valueEl, actionsEl, value, kind, label) {
    if (!value) {
      valueEl.innerHTML = '<span class="cell-muted">Not provided</span>';
      return;
    }
    var href = kind === 'phone' ? UI.telHref(value) : 'mailto:' + value;
    var a = document.createElement('a');
    a.href = href;
    a.textContent = value;
    valueEl.innerHTML = '';
    valueEl.appendChild(a);
    addCopyButton(actionsEl, value, label);
  }

  function fillStatusOptions(current) {
    el.status.innerHTML = DB.STATUSES.map(function (s) {
      return '<option value="' + UI.escapeHtml(s) + '"' +
        (s === current ? ' selected' : '') + '>' + UI.escapeHtml(s) + '</option>';
    }).join('');
  }

  function fillEmailTargets() {
    var opts = [];
    if (referral.your_email) {
      opts.push({ v: 'referrer', label: 'Referrer — ' + (referral.your_name || referral.your_email) });
    }
    if (referral.friend_email) {
      opts.push({ v: 'friend', label: 'Referred — ' + (referral.friend_name || referral.friend_email) });
    }
    if (opts.length === 0) {
      el.emailTarget.innerHTML = '<option value="">No email on file</option>';
      el.emailTarget.disabled = true;
      el.sendEmail.disabled = true;
      el.copyEmail.disabled = true;
      return;
    }
    el.emailTarget.disabled = false;
    el.sendEmail.disabled = false;
    el.copyEmail.disabled = false;
    el.emailTarget.innerHTML = opts.map(function (o) {
      return '<option value="' + o.v + '">' + UI.escapeHtml(o.label) + '</option>';
    }).join('');
  }

  // (Re)fill the subject + body from the template for the current recipient.
  function fillEmailTemplate() {
    var code = referral.referral_code || '(no Referral ID)';
    var t = selectedTarget();
    el.emailSubject.value = defaultSubject();
    el.emailBody.value = defaultBody(t.name, code);
    emailPristine = true;
    el.codeHint.textContent = 'Referral ID ' + code + ' is included automatically.';
  }

  function selectedTarget() {
    var v = el.emailTarget.value;
    if (v === 'friend') {
      return { email: referral.friend_email, phone: referral.friend_phone, name: referral.friend_name };
    }
    return { email: referral.your_email, phone: referral.your_phone, name: referral.your_name };
  }

  function populate() {
    el.refCode.textContent = referral.referral_code || '—';
    el.rowId.textContent = referral.id || '—';

    el.referrerName.textContent = referral.your_name || 'Unknown';
    setContact(el.referrerPhone, el.referrerPhoneActions, referral.your_phone, 'phone', 'referrer phone');
    setContact(el.referrerEmail, el.referrerEmailActions, referral.your_email, 'email', 'referrer email');
    el.contactMethod.textContent = referral.contact_method || '—';

    el.friendName.textContent = referral.friend_name || 'Unknown';
    setContact(el.friendPhone, el.friendPhoneActions, referral.friend_phone, 'phone', 'referred phone');
    setContact(el.friendEmail, el.friendEmailActions, referral.friend_email, 'email', 'referred email');
    el.submitted.textContent = UI.formatDate(referral.created_at);

    el.notes.value = referral.notes || '';
    fillStatusOptions(referral.status);
    fillEmailTargets();
    if (!el.emailTarget.disabled) fillEmailTemplate();
  }

  // ---- Email --------------------------------------------------------------
  // A browser page cannot send email silently (that needs a server/API). The
  // reliable, universal path is a mailto: link, which opens the user's default
  // mail client with the subject and body pre-filled. See README for how to
  // upgrade to true automatic sending via a Supabase Edge Function later.
  function openEmail() {
    var t = selectedTarget();
    if (!t.email) {
      UI.toast('No email address on file', 'error');
      return;
    }
    var code = referral.referral_code || '';
    var subject = el.emailSubject.value || defaultSubject();
    var body = el.emailBody.value || '';

    // Guarantee the Referral ID is in the message even if it was edited out,
    // so the recipient can always cash in.
    if (code && body.indexOf(code) === -1) {
      body += '\n\nYour Referral ID: ' + code;
      el.emailBody.value = body;
      UI.toast('Referral ID added to the message', 'info');
    }

    var url =
      'mailto:' + encodeURIComponent(t.email) +
      '?subject=' + encodeURIComponent(subject) +
      '&body=' + encodeURIComponent(body);
    window.location.href = url;
  }

  function callNumber(phone, who) {
    if (!phone) {
      UI.toast('No phone number for ' + who, 'error');
      return;
    }
    window.location.href = UI.telHref(phone);
  }

  // ---- Load ---------------------------------------------------------------
  async function load() {
    var id = getId();
    if (!id) {
      showError('No referral was selected. Go back to the dashboard and choose one.');
      return;
    }
    if (!DB.ready) {
      showError('Supabase isn\u2019t configured. Fill in config.js with your project URL and publishable key.');
      return;
    }
    try {
      referral = await DB.fetchReferralById(id);
      if (!referral) {
        showError('That referral could not be found. It may have been removed.');
        return;
      }
      el.loading.hidden = true;
      el.content.hidden = false;
      populate();
    } catch (err) {
      var msg = err && err.message ? err.message : 'Unknown error.';
      if (/relation|does not exist|schema cache|column/i.test(msg)) {
        msg = 'The referrals table isn\u2019t migrated yet. Run supabase/dashboard-migration.sql, then retry.';
      } else if (/Failed to fetch|NetworkError|ERR_NAME/i.test(msg)) {
        msg = 'Could not reach Supabase. Check the project URL in config.js and that the project is active.';
      }
      showError(msg);
    }
  }

  // ---- Events -------------------------------------------------------------
  el.copyCode.addEventListener('click', function () {
    UI.copy(referral && referral.referral_code, 'Referral ID');
  });
  el.callReferrer.addEventListener('click', function () {
    callNumber(referral && referral.your_phone, 'the referrer');
  });
  el.callFriend.addEventListener('click', function () {
    callNumber(referral && referral.friend_phone, 'the referred person');
  });
  el.sendEmail.addEventListener('click', openEmail);
  el.resetEmail.addEventListener('click', fillEmailTemplate);

  // Switching recipient re-fills the template ONLY if it hasn't been edited,
  // so custom wording is never lost.
  el.emailTarget.addEventListener('change', function () {
    if (emailPristine) fillEmailTemplate();
  });
  el.emailSubject.addEventListener('input', function () { emailPristine = false; });
  el.emailBody.addEventListener('input', function () { emailPristine = false; });

  el.copyEmail.addEventListener('click', function () {
    UI.copy(selectedTarget().email, 'email');
  });
  el.copyPhone.addEventListener('click', function () {
    UI.copy(selectedTarget().phone, 'phone');
  });

  el.status.addEventListener('change', async function () {
    var newStatus = el.status.value;
    var prev = referral.status;
    try {
      var saved = await DB.updateStatus(referral.id, newStatus);
      referral.status = saved.status;
      UI.toast('Status updated', 'success');
    } catch (err) {
      el.status.value = prev;
      UI.toast('Could not update status', 'error');
    }
  });

  el.saveNotes.addEventListener('click', async function () {
    var value = el.notes.value;
    el.saveNotes.disabled = true;
    var original = el.saveNotes.textContent;
    el.saveNotes.textContent = 'Saving…';
    try {
      var saved = await DB.updateNotes(referral.id, value);
      referral.notes = saved.notes;
      UI.toast('Notes saved', 'success');
    } catch (err) {
      UI.toast('Could not save notes', 'error');
    } finally {
      el.saveNotes.disabled = false;
      el.saveNotes.textContent = original;
    }
  });

  load();
})();
