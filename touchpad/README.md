# Touchpad Test

A free browser-based tester for trackpad, keyboard, and mouse, with a Mac and Windows troubleshooting blog. Live at [hardwaretesthub.net](https://hardwaretesthub.net), hosted on Cloudflare Workers. Plain HTML/CSS/JS — no build step, no framework.

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
  404.html
  robots.txt
  sitemap.xml
  wrangler.jsonc                      Cloudflare Workers config — clean URLs, 404 handling
  .assetsignore                       files in this folder that must not be served
  vercel.json                         unused by Cloudflare — kept for the parked Vercel project
  ads.txt                             placeholder — needs your real AdSense pub ID
  DEPLOYMENT.md                       how to deploy, and the custom-domain setup
```

There is no separate homepage: `/` **is** the tool, and the tab switcher at the top of the page moves between the trackpad, keyboard, and mouse tests.

## Routes

`wrangler.jsonc` sets `html_handling: "drop-trailing-slash"`, so pages serve without their `.html` suffix, and both the `.html` form and a trailing-slash form redirect to the clean URL:

| URL | File |
| --- | --- |
| `/` | `index.html` |
| `/blog/mac-trackpad-not-working` | `blog/mac-trackpad-not-working.html` |
| `/blog/windows-touchpad-not-working` | `blog/windows-touchpad-not-working.html` |
| `/blog/keyboard-not-working` | `blog/keyboard-not-working.html` |
| `/privacy-policy` | `privacy-policy.html` |
| anything else | `404.html`, served with a 404 status (`not_found_handling`) |

All internal links use these root-relative clean paths.

## How the tester works

It uses the Pointer Events API (covers mouse, touch, and pen through one interface) plus `wheel`/`gesture*` events for scroll and pinch-zoom, since a laptop trackpad reports to the browser as cursor movement + wheel deltas, not raw multi-touch — the tool tests what actually reaches the browser rather than pretending trackpads are touchscreens. Each detected gesture lights up in the results panel in real time; `js/app.js` is the entire logic, no dependencies.

## Deploying

Push to `main` — Cloudflare Workers Builds deploys automatically. Or from this folder:

```
npx wrangler deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the build settings, previews, the custom domain, and the parked Vercel project.

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
