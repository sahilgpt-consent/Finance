# Sahil Finance (Demo) - test website for Consentera cookie consent

A small fake finance website that sets real cookies in four categories, so you can test a Consentera cookie banner end to end.
It is not a real financial service.

## What is in it

| File | Purpose |
|---|---|
| `index.html` | Home page: products, EMI calculator, display-only contact form |
| `privacy.html` | Sample DPDP privacy and cookie notice, with the cookie table filled in automatically |
| `js/consent-shim.js` | Cookie helpers, the **cookie register** (every cookie the site sets), and the consent gate `SFConsent` |
| `js/app.js` | Sets necessary cookies, language preference (functional), EMI calculator, cookie inspector panel |
| `js/analytics-demo.js` | Fake analytics tracker. Blocked until **analytics** consent |
| `js/marketing-demo.js` | Fake ad pixel. Blocked until **marketing** consent |
| `serve.ps1` | Local web server for testing on `http://localhost:8080` |

## Cookies to enter in Consentera

| Cookie | Category | Purpose | Duration |
|---|---|---|---|
| `sf_session` | Strictly necessary | Session identifier | Session |
| `sf_csrf` | Strictly necessary | Form protection (CSRF) | Session |
| `sf_demo_consent` | Strictly necessary | Test panel's simulated consent (remove when the real banner is live) | 180 days |
| `sf_lang` | Functional | Remembers language | 365 days |
| `_sfa_id` | Analytics | Distinguishes visitors | 2 years |
| `_sfa_session` | Analytics | Groups page views into a visit | 30 minutes |
| `_sfa_pv` | Analytics | Counts page views | 2 years |
| `_sfm_px` | Marketing | Ad pixel browser ID | 90 days |
| `_sfm_click` | Marketing | Ad click reference (`?adclick=...` in the URL) | 90 days |

## 1. Run it locally

```
powershell -ExecutionPolicy Bypass -File serve.ps1
```
Open http://localhost:8080/ . The dark **Cookie inspector** panel (bottom right) shows every cookie live, colour-coded by category,
and has buttons to simulate Accept all / Reject all / per-category consent.

## 2. Put it online (Consentera needs a public address to verify)

Pick one:
- **Netlify Drop**: go to app.netlify.com/drop, sign in, and drag the `consentera-demo-site` folder onto the page. You get a URL like `https://<name>.netlify.app`.
- **GitHub Pages**: create a public repository, upload these files, then Settings > Pages > Deploy from branch `main`, folder `/ (root)`.
- **Cloudflare Pages**: Workers & Pages > Create > Pages > Upload assets.

## 3. Connect Consentera

1. In Consentera: Consent Collection > Cookie Consent Management > **Add website** > enter the public URL.
2. Verify ownership. If Consentera gives a meta tag, paste it into the `<head>` of `index.html` where the comment says so. If it gives a file, put it in this folder. Redeploy.
3. Add the cookies from the table above with their categories and purposes (or run Consentera's scanner after accepting all in the test panel).
4. Copy Consentera's banner snippet into `index.html` and `privacy.html`, at the marked spot **above** every other script except `consent-shim.js`.
5. Set `window.SF_SIMULATOR = false;` in both pages, and delete the `sf_demo_consent` row from Consentera's cookie list.
6. Wire the banner to the gate. In Consentera's "consent given / updated" callback, call `SFConsent.grant('analytics')`, `SFConsent.grant('marketing')`, `SFConsent.grant('functional')` for each accepted category, and `SFConsent.revoke(...)` then reload for withdrawn ones.
   If Consentera does its own script blocking instead, change `data-consent-category` on the two tracker scripts to the attribute it expects.
7. Point the footer **Cookie settings** link at Consentera's "open preferences" function (see the TODO in `js/app.js`).

## 4. Test checklist

- [ ] Incognito window: banner shows on the first visit
- [ ] Before choosing: only `sf_session` and `sf_csrf` exist
- [ ] Reject all: no `_sfa_*` or `_sfm_*` cookies, nothing logged in the console by the demo trackers
- [ ] Accept all: `_sfa_*` and `_sfm_*` appear; changing language now sets `sf_lang`
- [ ] Withdraw marketing via Cookie settings: `_sfm_*` cookies are deleted
- [ ] The choice appears under "inspect recorded choices" in Consentera
