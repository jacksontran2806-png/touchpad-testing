# Deploying this site

The site is hosted on **Cloudflare Pages**, project `hardwaretesthub`, in the
`jacksontran2806@gmail.com` account. The domain `hardwaretesthub.net` is
registered in the same Cloudflare account, so DNS and hosting live together.

- Live domain: `https://hardwaretesthub.net`
- Pages URL: `https://hardwaretesthub.pages.dev`

## Deploying a new version

From this folder:

```
wrangler pages deploy . --project-name hardwaretesthub --branch main
```

That publishes straight to production. Every deploy also gets its own
immutable preview URL (`https://<hash>.hardwaretesthub.pages.dev`) if you want
to check something before it goes live — deploy to a different `--branch` name
to get a preview without touching production.

This is a **direct-upload** project, so it does not auto-deploy when you push to
GitHub. If you'd rather have push-to-deploy, connect the repo in the dashboard
under **Workers & Pages → Create → Pages → Connect to Git** (build command
empty, output directory `touchpad`). Cloudflare can't convert an existing
direct-upload project to a Git-connected one — you'd create a second project and
move the custom domain over to it.

First-time setup on a new machine: `npm i -g wrangler` then `wrangler login`.

## Custom domain

The domain is attached to the Pages project. Because the zone is in the same
Cloudflare account, Cloudflare manages the DNS record itself — there is nothing
to add at a registrar.

To check its state:

```
wrangler pages project list
```

or in the dashboard: **Workers & Pages → hardwaretesthub → Custom domains**.

The domain is written into `robots.txt`, `sitemap.xml`, `privacy-policy.html`,
and the `<link rel="canonical">` tag on all five pages — if the domain ever
changes, all four need updating.

## Routing behaviour

There is no config file for routing. Cloudflare Pages does it by default:

- `/blog/keyboard-not-working` serves `blog/keyboard-not-working.html`
- `/blog/keyboard-not-working.html` **308-redirects** to the clean form, so any
  old inbound links to `.html` URLs still land correctly
- an unknown path serves `404.html` with a real 404 status

`vercel.json` is left in the repo only as a fallback for the parked Vercel
project; Cloudflare ignores it.

## The old Vercel project

The project also exists on Vercel (`touchpad`) as a fallback. It was never
promoted to production and the domain no longer points at it. To use it again:

1. `vercel --prod` from this folder.
2. **Settings → Deployment Protection** → set **Vercel Authentication** to
   **Only Preview Deployments**, and turn off **Password Protection** — otherwise
   the production URL shows a Vercel login wall to visitors.
3. **Settings → Domains** → add the domain, then repoint DNS at Vercel.
