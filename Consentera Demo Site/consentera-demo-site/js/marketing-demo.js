// Fake advertising pixel (stands in for something like Meta Pixel or Google Ads).
// It only runs after "marketing" consent, because index.html loads it as type="text/plain".
(function () {
  var C = window.SFCookies;
  if (!C.get('_sfm_px')) C.set('_sfm_px', 'px.1.' + Date.now() + '.' + Math.floor(Math.random() * 1e9), 90);
  var click = new URLSearchParams(location.search).get('adclick');
  if (click) C.set('_sfm_click', click, 90);
  console.log('[demo marketing] pixel fired for browser', C.get('_sfm_px'));
})();
