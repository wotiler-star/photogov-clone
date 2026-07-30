# PhotoGov Clone

A full clone of [www.photogov.net](https://www.photogov.net) — an online passport / visa / ID
photo maker — rebuilt with **Nuxt 3 + Vue 3 + Tailwind CSS** (the original site's tech stack).

## Features

- 🌍 100+ countries, 41 document templates with official size / DPI / background specs
- 🛠 In-browser photo tool: upload, crop-to-spec, zoom/pan, rotate, brightness & contrast
- 🎨 One-click white / blue background, plus optional AI background removal (MediaPipe)
- 📄 Export **JPG** and **PDF** (print-ready, 300 DPI)
- 📚 Documents / Passports / Visas listing with search & category filters
- 📄 Per-document detail pages with a compliance spec diagram
- 🔒 Private by design — all image processing runs in the browser

## Tech stack

- [Nuxt 3](https://nuxt.com/) (Vue 3, `<script setup>`)
- [Tailwind CSS](https://tailwindcss.com/)
- Canvas API for client-side image processing
- [jsPDF](https://github.com/parallax/jsPDF) for PDF export
- MediaPipe Selfie Segmentation (CDN) for AI background removal

## Getting started

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build -> .output
npm run preview  # serve the built app
```

Data lives in `data/countries.json` and `data/documents.json` and is exposed via the
`useData()` composable.

## Deploy (one-click)

The app is a Nuxt 3 / Nitro server (SSR). It builds to `.output/server` and runs with
`node .output/server/index.mjs`, so it deploys to any Node host or container platform.

### ▲ Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/wotiler-star/photogov-clone&framework=nuxt)

Vercel auto-detects Nuxt. `vercel.json` pins Node 22 and the build command.

### △ Netlify

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/wotiler-star/photogov-clone)

`netlify.toml` sets the build (`npm run build`) and publish dir (`.output`). Nuxt is
auto-detected and served as a serverless function.

### 🐳 Docker (any container host: Railway, Render, Fly, Cloud Run, self-host)

```bash
docker build -t photogov-clone .
docker run -p 3000:3000 photogov-clone
# or, with compose:
docker compose up -d
```

The multi-stage `Dockerfile` builds the app and serves it on port `3000`
(`HOST=0.0.0.0`, `PORT=3000`).

### 🟢 Render

`render.yaml` is included — click *New > Blueprint* in Render and point it at the repo.

### Manual (Node)

```bash
npm ci
npm run build
PORT=3000 node .output/server/index.mjs
```

> The `sitemap.xml` and `robots.txt` are generated dynamically by Nitro server routes,
> so they work on every host without extra setup.

## Project structure

```
components/      PhotoTool, TheHeader, TheFooter, CookieBanner, DocCard
composables/     useData (countries/documents), useCountry (shared selection)
pages/           index, documents, document/[slug], passports, visas,
                 dv-lottery, about, compliance, privacy, terms, help, contact, cookies, signin
layouts/         default (header + footer + cookie banner)
data/            countries.json, documents.json
```

## Disclaimer

This is an unofficial educational clone. It is **not affiliated with any government agency**
and is not the official PhotoGov service.
