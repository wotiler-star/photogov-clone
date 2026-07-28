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
