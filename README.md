# DeConnectors DEMO 2 — Premium

Clean visual rebuild of the DeConnectors one-pager (Corsa theme style) as a standalone TanStack Start + React app.

No WordPress, no malware, all images local, gold/champagne accent, luxury 2026 typography and refined spacing.

## Deploy to Netlify

1. Connect this repo to Netlify (Import from Git).
2. Build settings are in `netlify.toml`:
   - Build command: `npm run build`
   - Publish directory: `dist`
3. Node version 22 is set.
4. Deploy.

Nitro uses the `netlify` preset automatically when `NETLIFY=true` (set by Netlify builds).

Static assets + SSR functions are handled by Nitro.

## Local development

```bash
npm install
npm run dev
```

## Structure

- `src/components/site-page.tsx` – main one-pager
- `src/routes/blog/` – blog index + posts
- `src/data/` – static content + blog posts
- `public/media/` – all images (local)


## Supabase (shared project, unique per demo)

Both demos use the same Supabase project but stay isolated via the `site` column and `SITE_KEY` env var.

1. In Netlify site settings → Environment variables, set:
   - `DATABASE_URL` = `postgresql://postgres:ywehyabxiwjdthbvanjw@db.zaljeyembygscuhzdnng.supabase.co:5432/postgres`
   - `SITE_KEY` = `demo2` (this demo)
   - `NETLIFY` = `true` (already set by netlify.toml)

2. On first deploy the migration creates the `site` column and seeds only this demo's content.

Public pages only read rows where `site = SITE_KEY`.
