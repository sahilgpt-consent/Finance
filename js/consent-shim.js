// Cookie helpers, the cookie register, and a tiny consent gate.
// Loaded synchronously in <head> so everything below can use it.
(function () {
  var SFCookies = {
    set: function (name, value, days) {
      var exp = '';
      if (days) exp = '; expires=' + new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + encodeURIComponent(value) + exp + '; path=/; SameSite=Lax';
    },
    get: function (name) {
      var parts = document.cookie ? document.cookie.split('; ') : [];
      for (var i = 0; i < parts.length; i++) {
        var eq = parts[i].indexOf('=');
        if (parts[i].slice(0, eq) === name) return decodeURIComponent(parts[i].slice(eq + 1));
      }
      return null;
    },
    del: function (name) { document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/'; },
    all: function () {
      if (!document.cookie) return [];
      return document.cookie.split('; ').map(function (p) {
        var eq = p.indexOf('=');
        return { name: p.slice(0, eq), value: decodeURIComponent(p.slice(eq + 1)) };
      });
    }
  };

  // Every cookie this site sets. Copy these into Consentera when you configure the website.
  var REGISTER = {
    sf_session:      { category: 'necessary',  purpose: 'Keeps your visit secure and working (session identifier)', duration: 'Session',   party: 'First' },
    sf_csrf:         { category: 'necessary',  purpose: 'Protects forms against cross-site request forgery',         duration: 'Session',   party: 'First' },
    sf_demo_consent: { category: 'necessary',  purpose: 'Stores the simulated consent choice (test panel only)',      duration: '180 days',  party: 'First' },
    sf_lang:         { category: 'functional', purpose: 'Remembers your preferred language',                          duration: '365 days',  party: 'First' },
    _sfa_id:         { category: 'analytics',  purpose: 'Demo analytics: distinguishes visitors',                    duration: '2 years',   party: 'First' },
    _sfa_session:    { category: 'analytics',  purpose: 'Demo analytics: groups page views into a visit',            duration: '30 minutes', party: 'First' },
    _sfa_pv:         { category: 'analytics',  purpose: 'Demo analytics: counts page views',                         duration: '2 years',   party: 'First' },
    _sfm_px:         { category: 'marketing',  purpose: 'Demo ad pixel: identifies the browser for ad measurement',  duration: '90 days',   party: 'First' },
    _sfm_click:      { category: 'marketing',  purpose: 'Demo ad pixel: stores the ad click that brought you here',  duration: '90 days',   party: 'First' }
  };
  var CATEGORIES = ['necessary', 'functional', 'analytics', 'marketing'];

  var granted = { necessary: true };

  function activate(category) {
    var blocked = document.querySelectorAll('script[type="text/plain"][data-consent-category="' + category + '"]');
    Array.prototype.forEach.call(blocked, function (old) {
      var s = document.createElement('script');
      var src = old.getAttribute('data-consentera-src') || old.getAttribute('src');
      if (src) s.src = src; else s.textContent = old.textContent;
      s.setAttribute('data-consent-activated', category);
      old.parentNode.replaceChild(s, old);
    });
  }

  var SFConsent = {
    categories: CATEGORIES,
    register: REGISTER,
    has: function (c) { return !!granted[c]; },
    list: function () { return CATEGORIES.filter(function (c) { return granted[c]; }); },
    // Call this from Consentera's "consent given/updated" callback, e.g. SFConsent.grant('analytics')
    grant: function (c) {
      if (granted[c]) return;
      granted[c] = true;
      if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', function () { activate(c); });
      else activate(c);
      document.dispatchEvent(new CustomEvent('sf:consent', { detail: SFConsent.list() }));
    },
    // Withdrawal: forget consent and delete that category's cookies. A reload stops any script already running.
    revoke: function (c) {
      if (c === 'necessary') return;
      delete granted[c];
      Object.keys(REGISTER).forEach(function (n) { if (REGISTER[n].category === c) SFCookies.del(n); });
      document.dispatchEvent(new CustomEvent('sf:consent', { detail: SFConsent.list() }));
    }
  };

  // Cookies the Consentera widget itself may set (its own consent record) count as necessary.
  SFConsent.lookup = function (name) {
    if (REGISTER[name]) return REGISTER[name];
    if (/^(ce_|consentera)/i.test(name)) return { category: 'necessary', purpose: 'Consentera consent record', duration: '-', party: 'First' };
    return null;
  };

  // ---- Bridge: follow the Consentera banner's decisions ----
  // The widget fires "consentera:decision" with detail { granted: [...category keys], mustAsk: bool }.
  // Category keys come from your Consentera setup, so map common names onto this site's four categories.
  function normalise(key) {
    var k = String(key).toLowerCase();
    if (/necess|essential|strict|required/.test(k)) return 'necessary';
    if (/analytic|statist|perform|measure/.test(k)) return 'analytics';
    if (/market|advert|target|\bads?\b/.test(k)) return 'marketing';
    if (/function|prefer/.test(k)) return 'functional';
    return k;
  }
  document.addEventListener('consentera:decision', function (ev) {
    var d = ev.detail || {};
    var now = {};
    (d.granted || []).forEach(function (k) { now[normalise(k)] = true; });
    window.SFLastDecision = { raw: d.granted || [], mustAsk: !!d.mustAsk, mapped: Object.keys(now) };
    var withdrew = false;
    CATEGORIES.forEach(function (c) {
      if (c === 'necessary') return;
      if (now[c]) SFConsent.grant(c);
      else if (granted[c]) { SFConsent.revoke(c); withdrew = true; }
    });
    // A tracker that already ran keeps running until the page reloads, so reload after a withdrawal.
    if (withdrew) setTimeout(function () { location.reload(); }, 300);
  });

  window.SFCookies = SFCookies;
  window.SFConsent = SFConsent;
})();
