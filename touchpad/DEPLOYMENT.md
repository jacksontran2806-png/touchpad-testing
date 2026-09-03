# Deploying this site

Live at **https://hardwaretesthub.net**, running on **Cloudflare Workers**
(static assets) as the Worker `hardwaretesthub-site`, in the
`jacksontran2806@gmail.com` account.

> Not Cloudflare Pages. Pages was the original plan, but a Git-connected Pages
> project needs Cloudflare's GitHub App installed on the account, and the API
> rejected it (`code 8000011`). Workers static assets is what Cloudflare now
> recommends for static sites anyway, and Workers Builds gives the same
> push-to-deploy.

## Deploying

**Push to `main`.** Workers Builds checks out the repo and deploys. Nothing else
to do.

By hand, from this folder:

```
npx wrangler deploy
```

A push to any other branch runs `npx wrangler versions upload`, which publishes a
preview URL without touching production.

New machine: `npm i -g wrangler`, then `wrangler login`.

## Setup — already done, listed for reference

Both of these are complete. Nothing here needs doing again unless the project is
rebuilt from scratch.

- **Repo connected.** The Worker builds from
  `jacksontran2806-png/touchpad-testing` on push to `main`.
- **Custom domain attached.** `hardwaretesthub.net` is bound to the Worker.
  Because the domain is registered in the same Cloudflare account, Cloudflare
  created the DNS record and the certificate itself — there are no external DNS
  records to add anywhere.

### Build settings

Under the Worker → **Settings → Builds**. Defaults are wrong for this repo:

| Setting | Value | Why |
| --- | --- | --- |
| Build command | *(empty)* | Plain HTML/CSS/JS, no build step |
| Deploy command | `npx wrangler deploy` | Default |
| Non-production deploy command | `npx wrangler versions upload` | Default |
| Path / root directory | `touchpad` | The site is in a subfolder, **not** the repo root |
| API token | *(none)* | Workers Builds uses the connected account |

`Path` is the one that silently breaks things — if it's left at `/`, the deploy
either fails or ships the wrong folder.

## Routing

`wrangler.jsonc` handles most of it:

- `html_handling: "drop-trailing-slash"` — `/blog/keyboard-not-working` serves
  `blog/keyboard-not-working.html`. Both `/blog/keyboard-not-working.html` and
  `/blog/keyboard-not-working/` redirect to the clean URL, so old inbound links
  still land. These are **307** (temporary) redirects — Cloudflare's behaviour,
  not configurable. The `<link rel="canonical">` tags are what tell search
  engines which URL is authoritative.
- `not_found_handling: "404-page"` — unknown paths serve `404.html` with a real
  404 status. Without it they'd return the homepage at 200, which search engines
  index as duplicate homepages.

`_redirects` (same format Pages uses; not served itself, like `_headers`)
handles the rest: **permanent 301s for any blog post that's been moved to a
new URL.** The blog was reorganized into topic subfolders
(`blog/mouse/`, `blog/keyboard/`, `blog/trackpad/`) on 2026-09-03 — every post
that existed before that keeps a redirect from its old flat `/blog/<name>` URL.
If you ever move or rename a post again, add a new rule rather than deleting
the old ones — these are permanent, not cleanup.

## Headers

`_headers` (same format Pages uses; Cloudflare supports it for Workers static
assets too, and does not serve the file itself — verified).

- Security headers on every response: `X-Content-Type-Options: nosniff`,
  `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`,
  and a `Permissions-Policy` denying geolocation/mic/camera.
- HTML revalidates on every request, so a deploy is visible immediately.
- CSS/JS cache for a day, then serve stale for a week while revalidating.

**Why CSS/JS aren't cached for a year:** `style.css` and `app.js` have no
content hash in their filenames. `immutable` with a long max-age would leave
visitors running old JS against new HTML until the cache expired. If a build
step is ever added that emits hashed filenames (`app.a1b2c3.js`), switch those
two rules to `public, max-age=31536000, immutable` — that's the only safe way to
get a year-long cache here.

`X-Frame-Options: DENY` blocks embedding the tools in an iframe. If embeddable
widgets ever ship, this becomes `SAMEORIGIN` plus a `frame-ancestors` CSP.

## What isn't served

`.assetsignore` keeps `wrangler.jsonc`, the two markdown docs, and the local
`.vercel`/`.wrangler` folders out of the deployment — they sit in the same
folder as the site. Verified: those paths return 404. Anything added to this
folder that shouldn't be public needs a line there.

## The old Vercel project

The Vercel project `touchpad` still exists but is dead — never promoted to
production, no domain pointing at it, and `vercel.json` has been removed from
the repo. Delete it in the Vercel dashboard whenever you like.
