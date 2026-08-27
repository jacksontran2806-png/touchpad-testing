# Touchpad Test

A free browser-based tester for trackpad, keyboard, and mouse, with a Mac and Windows troubleshooting blog. Live at [hardwaretesthub.net](https://hardwaretesthub.net), hosted on Cloudflare Workers. Plain HTML/CSS/JS, no framework — the only build step is `node build.js`, and it's optional to run (see below).

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
  partials/                           shared header/footer/head source — see below
  build.js                            syncs partials/ into every page that has the markers
  favicon.png / icon-512.png / apple-touch-icon.png / og-image.png
  robots.txt
  sitemap.xml
  wrangler.jsonc                      Cloudflare Workers config — clean URLs, 404 handling
  _headers                            cache + security headers
  .assetsignore                       files in this folder that must not be served
  ads.txt                             placeholder — needs your real AdSense pub ID
  DEPLOYMENT.md                       how to deploy, and the custom-domain setup
```

There is no separate homepage: `/` **is** the tool, and the tab switcher at the top of the page moves between the trackpad, keyboard, and mouse tests.

## Shared header/footer

Every page carries its header, footer, and common `<head>` tags (favicons, font `<link>`, stylesheet) inline — Cloudflare serves plain files, there's no server-side templating. To keep them from drifting out of sync across pages, those blocks are wrapped in marker comments (`<!-- HEADER:START -->` … `<!-- HEADER:END -->`, and the same for `HEAD_COMMON`, `FOOTER`, `ADSENSE`) and `build.js` re-injects the current version of `partials/header.html` etc. into every marked file.

To change the nav, footer, or shared `<head>` tags: edit the matching file in `partials/`, then run:

```
node build.js
```

It reports which files it changed (or `already in sync`) and is safe to re-run any time — commit the regenerated pages along with your partial edit. `ADSENSE` is deliberately not in every page's markers: `404.html` has no `ADSENSE:START/END` block, so the ad script never lands on the error page.

Per-page fields — `<title>`, meta description, canonical URL, and Open Graph tags — live outside the markers in each file and aren't touched by the build.

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

## Google AdSense

Publisher ID `pub-1082746041497676` is wired in:

- The `adsbygoogle.js` script tag is in `<head>` on every real page (index, privacy policy, all three blog posts) — not on `404.html`, which is `noindex` and shows no ad slot.
- `ads.txt` carries the matching `DIRECT` line.

Still open:

- **Fill the empty `<div class="ad-slot">`** in `index.html` with a real `<ins class="adsbygoogle">` unit once a placement is chosen, or leave Auto ads on and drop the div entirely.
- **Confirm the contact email** in `privacy-policy.html` is one you want public.
- **Wait for the site to be indexed** (submit the URL in [Search Console](https://search.google.com/search-console) to speed this up) before applying at [google.com/adsense](https://www.google.com/adsense/).

The ad slot in `index.html` sits between the device tabs and the test area — never inside or overlapping the tool itself, matching AdSense's policy against ads that obstruct core page functionality.

## Local preview

Stylesheet, script, and icon paths are root-absolute (`/css/style.css`, `/favicon.png`, …), so opening `index.html` directly (`file://`) won't resolve them — serve the folder instead:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
