# Artifact Standards Site

Static website for [Artifact Standards](https://github.com/aaronpeikert/artifact-standards), built with [Eleventy](https://www.11ty.dev/) and deployed to GitHub Pages.

## How it works

1. On every push to `main`, daily at 06:00 UTC, or manually via workflow dispatch, a GitHub Actions workflow downloads the latest `data.yml` release asset from `aaronpeikert/artifact-standards`.
2. Eleventy reads the data from `src/_data/standards.yaml` and renders `src/index.njk`.
3. The built site in `public/` is deployed to GitHub Pages.

## Local development

```bash
# Install dependencies (Node.js 20+ required)
npm ci

# Download latest data
curl -fsSL -o src/_data/standards.yaml \
  https://github.com/aaronpeikert/artifact-standards/releases/latest/download/data.yml

# Serve locally with hot reload
npm run dev
```

## First-time GitHub Pages setup

In the site repository's Settings → Pages, set **Source** to **GitHub Actions**.
