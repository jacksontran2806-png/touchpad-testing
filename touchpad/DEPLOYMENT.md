# Deploying this site

The site runs on **Cloudflare Workers** (static assets), deployed automatically
by **Workers Builds** on every push to `main`. The domain `hardwaretesthub.net`
is registered in the same Cloudflare account, so DNS and hosting live together.

- Live domain: `https://hardwaretesthub.net`
- Worker: `hardwaretesthub-site`

## Deploying

Push to `main`. Workers Builds checks out the repo and runs the deploy command.

To deploy by hand from this folder:

```
npx wrangler deploy
```

Branch pushes other than `main` run `npx wrangler versions upload`, which
publishes a preview URL without touching production.

First-time setup on a new machine: `npm i -g wrangler` then `wrangler login`.

## Dashboard build settings

These are set on the Worker under **Settings → Builds**. Defaults are wrong for
this repo — all three matter:

| Setting | Value | Why |
| --- | --- | --- |
| Build command | *(empty)* | No build step |
| Deploy command | `npx wrangler deploy` | Default |
| Non-production deploy command | `npx wrangler versions upload` | Default |
| Path / root directory | `touchpad` | The site is in a subfolder, not the repo root |

No API token needs to be supplied — Workers Builds authenticates with the
connected account.

## Routing

`wrangler.jsonc` handles it, no redirect rules needed:

- `html_handling: "drop-trailing-slash"` — `/blog/keyboard-not-working` serves
  `blog/keyboard-not-working.html`. Both `/blog/keyboard-not-working.html` and
  `/blog/keyboard-not-working/` redirect to the clean URL, so old inbound links
  still land correctly. Note these are **307** (temporary) redirects — that is
  Cloudflare's behaviour and isn't configurable; the `<link rel="canonical">`
  tags are what tell search engines which URL is authoritative.
- `not_found_handling: "404-page"` — an unknown path serves `404.html` with a
  real 404 status. Without this, unknown paths return the homepage with a 200,
  which search engines index as duplicate homepages.

`.assetsignore` keeps this file, the README, `wrangler.jsonc`, `vercel.json` and
the local `.vercel`/`.wrangler` folders from being served — they sit in the same
folder as the site. Verified: those paths return 404. Anything added to this
folder that shouldn't be public needs a line there.

## Custom domain

Add under the Worker → **Settings → Domains & Routes → Add → Custom domain** →
`hardwaretesthub.net`. Because the zone is in the same Cloudflare account, the
DNS record and certificate are created automatically.

The domain is written into `robots.txt`, `sitemap.xml`, `privacy-policy.html`,
and the `<link rel="canonical">` tag on all five pages — if the domain ever
changes, all four need updating.

## The old projects

Two earlier deployments still exist and can be deleted once this one is live on
the domain:

- **Cloudflare Pages project `hardwaretesthub`** — direct-upload, superseded by
  this Worker. Its custom domain entry for `hardwaretesthub.net` never finished
  provisioning and must be removed before the domain can attach here.
- **Vercel project `touchpad`** — never promoted to production. `vercel.json` is
  kept in the repo only for it. To revive: `vercel --prod`, then
  **Settings → Deployment Protection** → **Vercel Authentication** →
  **Only Preview Deployments**, or visitors hit a Vercel login wall.
