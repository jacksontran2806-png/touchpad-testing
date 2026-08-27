# Touchpad Test

A free browser-based touchpad/trackpad tester with a Mac and Windows troubleshooting blog, built for GitHub Pages deployment. Plain HTML/CSS/JS — no build step, no framework.

## Structure

```
touchpad/
  index.html                          the tester tool
  css/style.css
  js/app.js
  blog/mac-trackpad-not-working.html
  blog/windows-touchpad-not-working.html
  privacy-policy.html
  ads.txt                             placeholder — needs your real AdSense pub ID
  .nojekyll                           tells GitHub Pages to serve files as-is
```

## How the tester works

It uses the Pointer Events API (covers mouse, touch, and pen through one interface) plus `wheel`/`gesture*` events for scroll and pinch-zoom, since a laptop trackpad reports to the browser as cursor movement + wheel deltas, not raw multi-touch — the tool tests what actually reaches the browser rather than pretending trackpads are touchscreens. Each detected gesture lights up in the results panel in real time; `js/app.js` is the entire logic, no dependencies.

## Deploying to GitHub Pages

1. Push this folder to a GitHub repo (as the repo root, or to a `/docs` folder — adjust Pages settings accordingly).
2. Repo → **Settings → Pages** → Source: deploy from branch → pick `main` and `/ (root)`.
3. Your site will be live at `https://<username>.github.io/<repo>/`, or configure a custom domain in the same settings page.

## Before applying to Google AdSense

AdSense requires your site to be live with real, indexable content — this repo ships with two full blog posts to satisfy that, but you still need to:

1. **Wait for the site to be live for a bit** and let Google index it (submit the URL in [Search Console](https://search.google.com/search-console) to speed this up).
2. **Replace the AdSense publisher ID** in three places once you're approved:
   - `ads.txt` — replace `pub-XXXXXXXXXXXXXXXX` with your real ID (get the exact line from AdSense → Sites → your site → "View ads.txt snippet")
   - `index.html` — uncomment the `adsbygoogle.js` `<script>` tag in `<head>` and fill in your publisher ID
   - Optionally replace the placeholder `.ad-inner` "Ad space" boxes with real `<ins class="adsbygoogle">` ad units, or leave Auto ads on and remove the placeholder boxes entirely
3. **Update `privacy-policy.html`** — replace the `<!-- REPLACE -->` comment with your actual domain name, and confirm the contact email is one you want public.
4. Apply at [google.com/adsense](https://www.google.com/adsense/).

Ad slots in `index.html` are placed above and below the test area (not inside or overlapping it), so ads never interfere with the tool itself — this also matches AdSense's policy against ads that obstruct core page functionality.

## Local preview

No build step needed — just open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
