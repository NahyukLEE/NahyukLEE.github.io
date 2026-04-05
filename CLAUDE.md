# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development

**Local dev server:**
```bash
python3 -m http.server 8080
```

**Deployment:** Automatic on push to `main` via GitHub Actions (`.github/workflows/pages.yml`). The entire repo root is deployed as a static site — no build step.

## Architecture

This is a **static HTML academic portfolio** for a Computer Vision Researcher. No framework, no package manager.

**Main pages:**
- `index.html` — Root portfolio page with sidebar (profile/links) + main content (About, News, Education, Publications, etc.)
- `publications/index.html` — Publications listing page
- `cmnet/index.html`, `pmtr/index.html` — Project demo pages (Nerfies-style template)
- `tora/index.html` — Interactive research visualization with point cloud comparison viewer

**`tora/` subdirectory** is the most complex part of the site. It contains:
- `js/` — Custom JavaScript for interactive visualizations (point cloud viewer, CKA charts, convergence plots)
- `json/` — Point cloud sample data loaded dynamically at runtime
- `csv/` — Dataset/metric data for charts
- `css/` — Page-specific styles

**Shared assets:**
- `css/style.css` — Main stylesheet for the portfolio
- `css/academicons.css` — Academic icon font
- `pic/` — Profile photos and institution logos
- `pdf/` — CV and paper PDFs
- `bibtex/` — BibTeX citation files

**No Jekyll build is used** despite the presence of `Gemfile`. The deployment skips Jekyll entirely and serves files as-is.
