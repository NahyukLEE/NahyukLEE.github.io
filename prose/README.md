# PROSE Project Page

Project page for **PROSE: Training-Free Egocentric Scene Registration with Vision-Language Models** (CoRL 2026 submission).

Built on the TORA project page template, orange color scheme.

## Figures (from the paper, in `static/images/`)

| File | Source | Used in |
|---|---|---|
| `teaser.png` | `teaser.pdf` (Fig. 1), rasterized at 200 DPI | Teaser section |
| `ego_src1/2.png`, `ego_ref1/2.png` | cropped from `Pipelinev3.png` INPUT column | Abstract (egocentric RGB examples) |
| `pipeline.png` | `corl26_architecture_img.png` (Fig. 2) | Method section |
| `qual1.png` / `qual2.png` | `corl_qual1/2.png` | (currently unused) |
| `correspondences.png` | `0120_0125_0130_correspondences.png` | (currently unused) |
| `robot_demo.png` | `corl_robot.png` | Path planning |
| `path_planning_bev.png` | `5_ml_hall_bev.pdf`, rasterized at 200 DPI | Path planning |

## TODO — remaining placeholders (`index.html`)

Search for `TODO` in `index.html`:

1. **Hero links** — arXiv / Code / Video buttons are disabled (`href="#"` + `.disabled` class). Replace the `href` and remove the `disabled` class when ready.
2. **Qualitative Examples viewers** — the four point-cloud panels (TEASER++ / SG-Reg / Ours / GT) with 5 samples currently show **procedurally generated sample scenes** (`js/point-cloud-viewer.js`). Replace `loadSample(index)` with real exported point clouds (e.g. JSON per sample, like the TORA page) when available.
3. **BibTeX** — update the arXiv id (`arXiv:XXXX.XXXXX`).
