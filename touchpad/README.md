# Hardware Test Hub

A free browser-based suite of tests for mouse, keyboard, and trackpad, plus a troubleshooting blog. Live at [hardwaretesthub.net](https://hardwaretesthub.net), hosted on Cloudflare Workers. Plain HTML/CSS/JS, no framework — the only build step is `node build.js`, and it's optional to run (see below).

## Structure

```
touchpad/
  index.html                          homepage — tool cards grouped Mouse / Keyboard / Gaming, plus guides
  trackpad-test.html
  mouse-test.html
  mouse-double-click-test.html
  mouse-scroll-test.html
  keyboard-test.html
  keyboard-ghosting-test.html
  cps-test.html
  reaction-time-test.html
  about.html
  privacy-policy.html
  404.html
  css/style.css
  js/app.js                           one file, every tool — each IIFE no-ops if its DOM isn't on the page
  blog/mac-trackpad-not-working.html
  blog/windows-touchpad-not-working.html
  blog/keyboard-not-working.html
  blog/mouse-double-clicking-fix.html
  blog/keyboard-key-not-working.html
  blog/mouse-scroll-not-working.html
  partials/                           shared header/footer/head source — see below
  build.js                            syncs partials/ into every page that has the markers
  favicon.png / icon-512.png / apple-touch-icon.png / og-image.png
  robots.txt
  sitemap.xml
  wrangler.jsonc                      Cloudflare Workers config — clean URLs, 404 handling
  _headers                            cache + security headers
  .assetsignore                       files in this folder that must not be served
  ads.txt                             AdSense publisher verification
  DEPLOYMENT.md                       how to deploy, and the custom-domain setup
```

## How the tools share one JS file

Every page loads the same `js/app.js`. Each tool is a self-contained IIFE that looks up its own root element and returns immediately if that element isn't on the page (`if (!el) return;`) — so a page only "activates" the tool whose markup it actually includes, and nothing needs splitting or duplicating per page. The keyboard-layout builder (rows, key labels, the container-width-fitting logic) is shared between the keyboard test and the ghosting/NKRO test via the `KB` object at the top of the file, so the on-screen keyboard is only built once.

## Shared header/footer

Every page carries its header, footer, and common `<head>` tags (favicons, font `<link>`, stylesheet) inline — Cloudflare serves plain files, there's no server-side templating. To keep them from drifting out of sync across a growing number of pages, those blocks are wrapped in marker comments (`<!-- HEADER:START -->` … `<!-- HEADER:END -->`, and the same for `HEAD_COMMON`, `FOOTER`, `ADSENSE`) and `build.js` re-injects the current version of `partials/header.html` etc. into every file that carries the markers.

To change the nav, footer, or shared `<head>` tags: edit the matching file in `partials/`, then run:

```
node build.js
```

It auto-discovers every `.html` file at the root and one level deep (e.g. `blog/`) — a new page just needs the marker comments pasted in, nothing to register. It reports which files it changed (or `already in sync`) and is safe to re-run any time — commit the regenerated pages along with your partial edit. `ADSENSE` is deliberately not in every page's markers: `404.html` has no `ADSENSE:START/END` block, so the ad script never lands on the error page.

Per-page fields — `<title>`, meta description, canonical URL, and Open Graph tags — live outside the markers in each file and aren't touched by the build.

**Homepage anchor IDs matter**: the nav links to `/#mouse`, `/#keyboard-tools`, `/#gaming`, `/#guides` — those are section IDs on `index.html`. `#keyboard-tools` (not `#keyboard`) is deliberate: `js/app.js` looks up `document.getElementById("keyboard")` for the actual on-screen keyboard board, and an id collision there previously caused the homepage's Keyboard section to be silently wiped and replaced with a live keyboard test. If you rename a homepage section id, grep `js/app.js` for `getElementById` first.

## Routes

`wrangler.jsonc` sets `html_handling: "drop-trailing-slash"`, so pages serve without their `.html` suffix, and both the `.html` form and a trailing-slash form redirect to the clean URL. Every `.html` file at the root maps to `/<name>`; everything in `blog/` maps to `/blog/<name>`. Unknown paths serve `404.html` with a real 404 status (`not_found_handling`).

All internal links use these root-relative clean paths. A link-check script (not checked into the repo) verifies every internal `href`/`src` resolves to a real route or file before each deploy — see the note below if you add a page and want to re-run it yourself; it's a ~40-line Node script that walks the HTML for `href="/..."` and `src="/..."` and checks each against the file tree.

## How the testers work

They use the Pointer Events API (covers mouse, touch, and pen through one interface) plus `wheel`/`gesture*` events for scroll and pinch-zoom, since a laptop trackpad reports to the browser as cursor movement + wheel deltas, not raw multi-touch — the tools test what actually reaches the browser rather than pretending trackpads are touchscreens. The keyboard tools use the Keyboard Events API, reading `event.code` (physical position) separately from `event.key` (character produced) so a layout mismatch and a dead key are distinguishable. Each detected input lights up its result live; `js/app.js` is the entire logic, no dependencies.

## Deploying

Push to `main` — Cloudflare Workers Builds deploys automatically. Or from this folder:

```
npx wrangler deploy
```

See [DEPLOYMENT.md](DEPLOYMENT.md) for the build settings, previews, the custom domain, and the parked Vercel project.

## Google AdSense

Publisher ID `pub-1082746041497676` is wired in:

- The `adsbygoogle.js` script tag is in `<head>` on every real page — not on `404.html`, which is `noindex` and shows no ad slot.
- `ads.txt` carries the matching `DIRECT` line.

Still open:

- **Fill the empty `<div class="ad-slot">`** in `index.html` with a real `<ins class="adsbygoogle">` unit once a placement is chosen, or leave Auto ads on and drop the div entirely.
- **Set Auto ads exclusion zones** in the AdSense dashboard (Ads → Edit site → Ad settings → Excluded areas) around every `.test-wrap`/`.canvas-card`/interactive test surface, and turn off Anchor/Vignette ad formats — these tools capture raw clicks/keys/scroll, and an algorithmically-placed ad inside a test area risks intercepting input the tester is supposed to catch. This can't be done from code; it needs the AdSense account login.
- **Confirm the contact email** in `privacy-policy.html` is one you want public.

The ad slot in `index.html` sits between the hero and the tool sections — never inside or overlapping a tool itself, matching AdSense's policy against ads that obstruct core page functionality.

## Local preview

Stylesheet, script, and icon paths are root-absolute (`/css/style.css`, `/favicon.png`, …), so opening a page directly (`file://`) won't resolve them — serve the folder instead:

```
python3 -m http.server 8000
```

Then visit `http://localhost:8000`.
