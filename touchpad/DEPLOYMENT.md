# Deploying this site on Vercel

Manual dashboard steps — nothing here is a code setting.

## 1. Promote current deployment to Production

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard) → open this project.
2. Click the **Deployments** tab.
3. Find the deployment you want live (usually the latest one from `main`).
4. Click the **⋯** menu on that deployment → **Promote to Production**.
   - Alternatively, from your terminal in this folder: `vercel --prod`.

## 2. Turn off Deployment Protection for the production domain

By default Vercel can password-wall preview and/or production URLs (Deployment Protection). To make the live site public:

1. In the project, go to **Settings → Deployment Protection**.
2. Under **Vercel Authentication**, set it to **Only Preview Deployments** (not "Standard Protection" / "All Deployments") — this keeps previews private but makes Production public.
3. If **Password Protection** is enabled, turn it off (or scope it to previews only) so the production domain doesn't prompt visitors for a password.
4. Save, then open your production URL in an incognito window to confirm it loads with no login prompt.

## 3. Add a custom domain later

1. Go to **Settings → Domains**.
2. Enter your domain (e.g. `touchpadtest.com`) → **Add**.
3. Vercel shows you DNS records (usually an `A` record to `76.76.21.21` or a `CNAME` to `cname.vercel-dns.com`) — add those at your domain registrar.
4. Wait for DNS to propagate (usually minutes, sometimes up to a few hours) — Vercel auto-issues an SSL cert once it verifies.
5. Once verified, set it as the **Primary Domain** in the same Domains settings page so canonical links and redirects point to it.

The live domain is `hardwaretesthub.net`. It is already written into `robots.txt`, `sitemap.xml`, `privacy-policy.html`, and the `<link rel="canonical">` tag on every page — if the domain ever changes, all four need updating.

### Cloudflare DNS for hardwaretesthub.net

The domain is registered at Cloudflare and attached to the Vercel project. In Cloudflare → the domain → **DNS → Records**, the apex record must be:

| Type | Name | Content | Proxy status |
| --- | --- | --- | --- |
| CNAME | `@` | `5e4bd5419863be99.vercel-dns-017.com` | **DNS only** (grey cloud) |

Proxy status must be **DNS only**. Cloudflare's orange-cloud proxy sits in front of Vercel and blocks the certificate challenge, so the site ends up on an SSL error instead of loading.

Then `vercel domains verify hardwaretesthub.net` should report `"ok": true`.
