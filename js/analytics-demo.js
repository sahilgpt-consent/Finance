// Fake analytics tracker (stands in for something like Google Analytics).
// It only runs after "analytics" consent, because index.html loads it as type="text/plain".
(function () {
  var C = window.SFCookies;
  if (!C.get('_sfa_id')) C.set('_sfa_id', 'SFA.' + Math.random().toString(36).slice(2, 12), 730);
  C.set('_sfa_session', Date.now().toString(36), 1 / 48); // 30 minutes
  C.set('_sfa_pv', String((parseInt(C.get('_sfa_pv'), 10) || 0) + 1), 730);
  console.log('[demo analytics] page view recorded:', location.pathname, 'visitor', C.get('_sfa_id'));
})();
