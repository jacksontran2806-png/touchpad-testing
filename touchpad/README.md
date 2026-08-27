# Touchpad Test

A free browser-based tester for trackpad, keyboard, and mouse, with a Mac and Windows troubleshooting blog. Deployed on Vercel. Plain HTML/CSS/JS — no build step, no framework.

## Structure

```
touchpad/
  index.html                          the tester tool (trackpad / keyboard / mouse tabs)
  css/style.css
  js/app.js
  blog/mac-trackpad-not-working.html
  blog/windows-touchpad-not-working.html
  blog/keyboard-not-working.html
  privacy-policy.html
  robots.txt
  sitemap.xml
  vercel.json                         clean URLs (no .html suffix), no trailing slash
  ads.txt                             placeholder — needs your real AdSense pub ID
  DEPLOYMENT.md                       manual Vercel dashboard steps
```

There is no separate homepage: `/` **is** the tool, and the tab switcher at the top of the page moves between the trackpad, keyboard, and mouse tests.

## Routes

`vercel.json` sets `cleanUrls`, so pages serve without their `.html` suffix (and `.html` URLs redirect to the clean form):

| URL | File |
| --- | --- |
| `/` | `index.html` |
| `/blog/mac-trackpad-not-working` | `blog/mac-trackpad-not-working.html` |
| `/blog/windows-touchpad-not-working` | `blog/windows-touchpad-not-working.html` |
| `/blog/keyboard-not-working` | `blog/keyboard-not-working.html` |
| `/privacy-policy` | `privacy-policy.html` |

All internal links use these root-relative clean paths.

## How the tester works

It uses the Pointer Events API (covers mouse, touch, and pen through one interface) plus `wheel`/`gesture*` events for scroll and pinch-zoom, since a laptop trackpad reports to the browser as cursor movement + wheel deltas, not raw multi-touch — the tool tests what actually reaches the browser rather than pretending trackpads are touchscreens. Each detected gesture lights up in the results panel in real time; `js/app.js` is the entire logic, no dependencies.

## Deploying

See [DEPLOYMENT.md](DEPLOYMENT.md) for promoting to Production, turning off Deployment Protection, and adding a custom domain. From this folder, `vercel --prod` deploys straight to production.

## Before applying to Google AdSense

AdSense requires your site to be live with real, indexable content — this repo ships with three full blog posts to satisfy that, but you still need to:

1. **Wait for the site to be live for a bit** and let Google index it (submit the URL in [Search Console](https://search.google.com/search-console) to speed this up).
2. **Add your AdSense publisher ID** once you're approved:
   - `ads.txt` — replace `pub-XXXXXXXXXXXXXXXX` with your real ID (get the exact line from AdSense → Sites → your site → "View ads.txt snippet")
   - `index.html` — add the `adsbygoogle.js` `<script>` tag to `<head>` with your publisher ID
   - Fill the empty `<div class="ad-slot">` with a real `<ins class="adsbygoogle">` unit, or leave Auto ads on and drop the div entirely
3. **Confirm the contact email** in `privacy-policy.html` is one you want public.
4. Apply at [google.com/adsense](https://www.google.com/adsense/).

The ad slot in `index.html` sits between the device tabs and the test area — never inside or overlapping the tool itself, matching AdSense's policy against ads that obstruct core page functionality.

## Local preview

No build step needed — just open `index.html` in a browser, or serve the folder locally:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
