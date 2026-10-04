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
  screen-test.html                    full-screen colors/patterns; canvas patterns are drawn in device pixels
  about.html
  contact.html
  sitemap.html                        human-readable index; its link list is GENERATED
  privacy-policy.html
  cookies-policy.html
  terms-and-conditions.html
  disclaimer.html
  404.html
  css/style.css
  js/app.js                           one file, every tool — each IIFE no-ops if its DOM isn't on the page
  blog/mouse/mouse-not-working.html
  blog/mouse/mouse-double-clicking-fix.html
  blog/mouse/mouse-double-clicking-single-click.html
  blog/mouse/mouse-scroll-not-working.html
  blog/mouse/mouse-scrolling-wrong-direction.html
  blog/mouse/mouse-light-on-cursor-not-moving.html
  blog/keyboard/keyboard-not-working.html
  blog/keyboard/keyboard-key-not-working.html
  blog/keyboard/keyboard-typing-multiple-letters.html
  blog/keyboard/keyboard-typing-numbers-instead-of-letters.html
  blog/keyboard/wasd-arrow-keys-swapped.html
  blog/trackpad/mac-trackpad-not-working.html
  blog/trackpad/windows-touchpad-not-working.html
  es/  de/                            Spanish and German copies of the homepage, tools, About and Contact
  partials/                           shared header/footer/head source — see below
  partials/es/  partials/de/          translated header/footer/head-common
  build.js                            syncs partials/ into every page that has the markers, at any depth
  seo-build.js                        regenerates each page's JSON-LD and the sitemap, called from build.js
  seo-data.js                         the page metadata that can't be read out of the HTML (dates, sections, languages)
  i18n.js                             language-folder path helpers shared by build.js and seo-build.js
  favicon.png / icon-512.png / apple-touch-icon.png / og-image.png
  robots.txt
  sitemap.xml
  wrangler.jsonc                      Cloudflare Workers config — clean URLs, 404 handling
  _headers                            cache + security headers
  _redirects                          301s for blog posts that moved into topic subfolders
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

It auto-discovers every `.html` file at any depth (root, `blog/`, and topic subfolders like `blog/mouse/`) — a new page just needs the marker comments pasted in, nothing to register. It reports which files it changed (or `already in sync`) and is safe to re-run any time — commit the regenerated pages along with your partial edit. `ADSENSE` is deliberately not in every page's markers: `404.html` has no `ADSENSE:START/END` block, so the ad script never lands on the error page.

Per-page fields — `<title>`, meta description, canonical URL, and Open Graph tags — live outside the markers in each file and aren't touched by the build.

## Languages

English lives at the root. Spanish and German are full copies of a page in `es/` and `de/`, served at `/es/<page>` and `/de/<page>` (`es/index.html` is `/es`). Each translation is its own static, crawlable HTML file — no runtime translation, no `?lang=` parameter.

**A translation is paired with its original by file name.** `es/mouse-test.html` is the Spanish version of `mouse-test.html` because the path after the language folder matches. Keep the English slug in translated URLs; renaming the file breaks the pairing.

`node build.js` does the rest from those file names:

- **hreflang tags** go in every page's `<head>` between `<!-- HREFLANG:START/END -->`, listing each language the page exists in plus `x-default` (English). A page with no translations gets none.
- **The language switcher** (EN · ES · DE) is generated into the header between `<!-- LANG_SWITCH:START/END -->`. When the current page has no translation in a language, that link goes to the language's homepage instead of a 404.
- **sitemap.xml** carries the same hreflang set as `<xhtml:link>` entries, and `sitemap.html` lists the translations under their own headings.
- **JSON-LD** gets `inLanguage` and translated breadcrumb labels (`home` and `sections` in `seo-data.js`).
- **Partials**: a page in `es/` gets `partials/es/*.html`, falling back to `partials/*.html` for anything not translated (`adsense.html`). So nav/footer edits must be made in each language's copy.

To translate another page: copy the English file into `es/` (or `de/`), set `<html lang="es">`, update the canonical and `og:url` to the `/es/...` URL, translate the content, point internal links at `/es/...` versions where they exist, add a `published` date in `seo-data.js`, and run the build. Links to content that only exists in English (the blog, the legal pages) carry `hreflang="en"` and, on cards, a `<span class="lang-tag">EN</span>` badge.

To add a language: add it to `languages` (and `sections`) in `seo-data.js`, create `partials/<lang>/` with a translated header, footer and head-common (`og:locale`), add the runtime strings to `STRINGS` in `js/app.js`, and add its two cache rules to `_headers`.

**Runtime text** (statuses like "Detected", CPS tiers, reaction-test prompts, copied share text) lives in `STRINGS` at the top of `js/app.js`, keyed by the English string and picked by `<html lang>`. A string missing from a table falls back to English.

The blog and the legal pages (privacy, cookies, terms, disclaimer) are English only for now.

## Cookie consent

The consent banner is part of `partials/footer.html`, so `node build.js` puts it on every page that carries the `FOOTER` markers — there is no per-page markup to add. Three pieces work together:

1. `partials/adsense.html` sets Google Consent Mode v2 defaults to **denied** for ad storage, ad personalization, ad user data, and analytics storage. This block must stay **above** the `adsbygoogle.js` tag in that file — consent defaults only apply to tags loaded after them.
2. `partials/footer.html` carries the banner markup, hidden by default (`hidden` attribute).
3. The cookie IIFE at the bottom of `js/app.js` reveals the banner when no choice is stored, and on Accept calls `gtag("consent", "update", …)` to move everything to granted.

The choice is stored in `localStorage` under `hth-cookie-consent` (`accepted` / `declined`) — deliberately not a cookie of our own. Every storage access is wrapped in try/catch, because private windows and blocked-site-data settings throw on access rather than returning null.

Because the banner lives in the footer, **every page needs `js/app.js`** — including the static and blog pages, which previously did not load it. If you add a page, include `<script src="/js/app.js"></script>` before `</body>` or the banner will render and never respond. The `gtag` call is guarded by a `typeof` check, so `404.html` (which carries no ad script) is safe.

## Generated content — do not hand-edit

Three things are generated by `node build.js` and will be overwritten:

- **`sitemap.xml`** — built from each page's `<link rel="canonical">`.
- **The link list in `sitemap.html`** — between `<!-- SITEMAP_LINKS:START/END -->`, grouped into tools / keyboard / mouse / trackpad / site pages. Everything outside those markers is yours to edit.
- **The JSON-LD block** in every page, between `<!-- SCHEMA:START/END -->`.

Add a page with a `<title>`, a meta description and a canonical, run the build, and it appears in both sitemaps with the right schema. Nothing to register by hand.

### FAQ structured data comes from the markup

Pages used to carry a hand-written `FAQPage` JSON-LD block next to the visible accordion, so every FAQ edit had to be made twice. `seo-build.js` now reads `<details class="faq-item">` blocks straight out of the page — summary becomes the question, the `.faq-answer` paragraphs become the answer — and emits `FAQPage` into the generated graph.

So **to change an FAQ, edit only the visible accordion.** Never add a standalone `FAQPage` script; you would end up with two conflicting declarations on one page. This applies to guides and tool pages alike.

## Published vs modified dates

`seo-data.js` keeps two maps, and they mean different things:

- `published` — when a page first went live. Set once, then never touched. A page that claims a later publication date throws away the age signal it has already earned.
- `dates` — `dateModified`, and the sitemap's `lastmod`. Bump this when you meaningfully rewrite a page.

A page with no `published` entry falls back to `defaultDate`; a page with no `dates` entry falls back to its own published date. Both maps are keyed by path relative to this folder, with the `.html` extension.

**Homepage anchor IDs matter**: the nav links to `/#mouse`, `/#keyboard-tools`, `/#gaming`, `/#guides` (`/#display` holds the screen test, linked from the footer) — those are section IDs on `index.html`. `#keyboard-tools` (not `#keyboard`) is deliberate: `js/app.js` looks up `document.getElementById("keyboard")` for the actual on-screen keyboard board, and an id collision there previously caused the homepage's Keyboard section to be silently wiped and replaced with a live keyboard test. If you rename a homepage section id, grep `js/app.js` for `getElementById` first.

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
