(function () {
  var C = window.SFCookies, K = window.SFConsent;

  // ---- Strictly necessary cookies: set on every visit, no consent needed ----
  function rand(n) { var s = ''; while (s.length < n) s += Math.random().toString(36).slice(2); return s.slice(0, n); }
  if (!C.get('sf_session')) C.set('sf_session', rand(24));
  if (!C.get('sf_csrf')) C.set('sf_csrf', rand(32));
  var csrfField = document.getElementById('csrfField');
  if (csrfField) csrfField.value = C.get('sf_csrf');

  // ---- Simulated consent (test panel). Turned off by setting window.SF_SIMULATOR = false ----
  var SIM = window.SF_SIMULATOR !== false;
  if (SIM) {
    var saved = C.get('sf_demo_consent');
    if (saved) saved.split(',').forEach(function (c) { if (c) K.grant(c); });
  }
  function saveSim() { C.set('sf_demo_consent', K.list().filter(function (c) { return c !== 'necessary'; }).join(','), 180); }

  // ---- Functional cookie: language preference, only remembered with consent ----
  var TEXT = {
    en: { t: 'Smart loans and savings, made simple', s: 'Personal loans, fixed deposits and credit tools for everyday India.' },
    hi: { t: 'स्मार्ट लोन और बचत, आसान तरीके से', s: 'हर भारतीय के लिए पर्सनल लोन, फिक्स्ड डिपॉज़िट और क्रेडिट टूल्स।' }
  };
  var langSel = document.getElementById('langSelect');
  function applyLang(l) {
    var t = document.getElementById('heroTitle'), s = document.getElementById('heroSub');
    if (t && TEXT[l]) { t.textContent = TEXT[l].t; s.textContent = TEXT[l].s; }
    document.documentElement.lang = l;
  }
  if (langSel) {
    var savedLang = K.has('functional') ? C.get('sf_lang') : null;
    if (savedLang) { langSel.value = savedLang; applyLang(savedLang); }
    langSel.addEventListener('change', function () {
      applyLang(langSel.value);
      if (K.has('functional')) C.set('sf_lang', langSel.value, 365);
      else console.log('[demo] language changed but not remembered: functional cookies not consented');
    });
  }

  // ---- EMI calculator ----
  var amt = document.getElementById('amt'), rate = document.getElementById('rate'), months = document.getElementById('months');
  function emi() {
    var P = +amt.value, r = +rate.value / 1200, n = +months.value;
    var e = r ? P * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1) : P / n;
    document.getElementById('emiOut').textContent = isFinite(e) && e > 0 ? 'Rs ' + Math.round(e).toLocaleString('en-IN') : '-';
  }
  if (amt) { [amt, rate, months].forEach(function (el) { el.addEventListener('input', emi); }); emi(); }

  var form = document.getElementById('contactForm');
  if (form) form.addEventListener('submit', function (ev) { ev.preventDefault(); document.getElementById('formMsg').textContent = 'Demo only: nothing was sent.'; });

  // ---- Cookie table on the privacy page ----
  var tbody = document.querySelector('#cookieTable tbody');
  if (tbody) {
    Object.keys(K.register).forEach(function (n) {
      var r = K.register[n], tr = document.createElement('tr');
      [n, r.category, r.purpose, r.duration, r.party].forEach(function (v) { var td = document.createElement('td'); td.textContent = v; tr.appendChild(td); });
      tbody.appendChild(tr);
    });
  }

  // ---- Cookie inspector / test panel ----
  var box = document.getElementById('inspector');
  function render() {
    if (!box) return;
    var cookies = C.all();
    var html = '<header id="inspToggle"><span>Cookie inspector (' + cookies.length + ')</span><span>' + (box.classList.contains('collapsed') ? '▲' : '▼') + '</span></header><div class="body">';
    html += '<h4>Cookies in this browser now</h4>';
    if (!cookies.length) html += '<div class="note">No cookies yet.</div>';
    cookies.forEach(function (c) {
      var reg = K.register[c.name], cat = reg ? reg.category : 'unknown';
      html += '<div class="row"><span class="tag ' + cat + '">' + cat + '</span><span class="name">' + esc(c.name) + '</span><span class="val">' + esc(c.value) + '</span></div>';
    });
    html += '<h4>Consent granted</h4><div class="note">' + K.list().join(', ') + '</div>';
    if (SIM) {
      html += '<h4>Simulate a consent banner</h4><div class="sim">' +
        '<button data-act="all">Accept all</button><button data-act="none">Reject all</button>' +
        ['functional', 'analytics', 'marketing'].map(function (c) { return '<button data-cat="' + c + '" class="' + (K.has(c) ? 'on' : '') + '">' + c + (K.has(c) ? ' ✓' : '') + '</button>'; }).join('') +
        '<button data-act="clear">Clear all cookies</button></div>' +
        '<div class="note">Testing only. Once the Consentera banner is installed, set SF_SIMULATOR = false and use the real banner.</div>';
    } else {
      html += '<div class="note">Simulator off: consent comes from the Consentera banner.</div>';
    }
    box.innerHTML = html + '</div>';
  }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (ch) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]; }); }

  if (box) {
    box.addEventListener('click', function (ev) {
      var t = ev.target.closest('button, header');
      if (!t) return;
      if (t.id === 'inspToggle' || t.tagName === 'HEADER') { box.classList.toggle('collapsed'); render(); return; }
      var act = t.getAttribute('data-act'), cat = t.getAttribute('data-cat'), reload = false;
      if (act === 'all') ['functional', 'analytics', 'marketing'].forEach(function (c) { K.grant(c); });
      if (act === 'none') { ['functional', 'analytics', 'marketing'].forEach(function (c) { K.revoke(c); }); reload = true; }
      if (act === 'clear') { C.all().forEach(function (c) { C.del(c.name); }); location.reload(); return; }
      if (cat) { if (K.has(cat)) { K.revoke(cat); reload = true; } else K.grant(cat); }
      saveSim();
      if (reload) location.reload(); else setTimeout(render, 150);
    });
    render();
    // Re-render only when cookies change, so buttons are not replaced while someone clicks them.
    var lastCookies = document.cookie;
    setInterval(function () { if (document.cookie !== lastCookies) { lastCookies = document.cookie; render(); } }, 1000);
  }

  // Footer "Cookie settings" link: reopen Consentera's preferences if available, else open the test panel.
  document.querySelectorAll('#cookieSettingsLink').forEach(function (a) {
    a.addEventListener('click', function (ev) {
      ev.preventDefault();
      // TODO: replace with Consentera's "open preferences" call once you have its snippet.
      if (box) { box.classList.remove('collapsed'); render(); }
    });
  });
})();
