# Design (working stub)

Functional status lives in [progress-and-features.md](progress-and-features.md). This file is what `css/style.css` + `js/theme.js` / `js/boot.js` actually do. Tokens exist; several values are still one-offs.

## Theme

| | Dark (default) | Light |
|---|---|---|
| `--bg` | `#0c1017` | `#f4f6fa` |
| `--bg-card` / elevated | `#1a2332` / `#141b26` | `#ffffff` |
| `--text` / muted | `#e8eef7` / `#8b9bb4` | `#0f172a` / `#64748b` |
| `--accent` | `#5b8def` | `#3b6fd9` |
| `--success` / `--danger` / `--warning` | `#34d399` / `#f87171` / `#fbbf24` | `#059669` / `#dc2626` / `#d97706` |

- `data-theme="light"|"dark"` on `<html>`. Boot script + `initTheme()` read `nfmt-theme` or `prefers-color-scheme`.
- Explicit toggle persists; system changes apply only when nothing is saved.
- `meta theme-color` tracks the theme (`#0c1017` / `#f4f6fa`). Manifest `theme_color` / `background_color` stay dark.
- Body wash: radial accent + success blobs. `color-scheme` set per theme.

## Tokens in use

| Group | Values |
|---|---|
| Font | `--font-sans`: DM Sans + system-ui; `--font-mono`: JetBrains Mono (scores, timer, stats) |
| Space | `--space-1`…`--space-12` (0.25rem–3rem) |
| Radius | sm 0.5 → xl 1.25, `--radius-full` |
| Motion | `--duration` 200ms, `--ease` cubic-bezier(0.4,0,0.2,1) |
| Layout | `--max-width` 960px, `--header-h` 4.5rem |
| Focus | `--focus-ring`: 3px `--accent-glow` |

Breakpoints in CSS: 480 / 640 / 768. `prefers-reduced-motion` zeros animation/transition duration.

## Shell

`.app` column, centered, horizontal `--space-4`. Sticky `.header` (blur + translucent bg): brand mark, title, stats / language / theme. `.main` holds one visible `.screen` (`hidden` + `.screen--active`). Sticky `.screen__footer` for primary actions (safe-area padding). `.footer` privacy line.

Screens: settings, memorize, recall, results, stats. Loading overlay is a full-main `role="status"` spinner, not a dialog.

## Component patterns (as coded)

| Pattern | Class / control | Notes |
|---|---|---|
| Card | `.card` | Elevated surface, `--radius-lg`, 1px `--border` |
| Settings grid | `.settings-grid` | 1 col → 2 col at 640px; `.setting-card--wide` spans |
| Chips | `.chip-toggle` | Hidden checkbox + pill |
| Segmented | `.segmented` | Radio group (gender, layout, name pos, input) |
| Switch | `.switch` | 2.75×1.5rem track |
| Slider | `.slider` | 6px track, 1.25rem thumb |
| Presets | `.preset-btn` | Pill; `.is-active` after click |
| Buttons | `.btn--primary` / `--ghost` / `--lg` / `--icon` / `--danger` | Primary is accent gradient |
| Face grid | `.face-grid--tiles` / `--column` | Tiles `minmax(140–180px)`; column max 360–420px |
| Face card | `.face-card` | Square image, name or input; `--correct` / `--wrong` |
| Timer | `.timer-display`, `.timer-progress` | Urgent pulse ≤5s |
| Score | `.results-score__ring` | SVG circle, color by % |
| Stats | `.stat-card`, `.sparkline`, `.stats-history` | Mono numbers |
| Toast | `.toast-container` | Fixed bottom, `role=status`/`alert` |
| Focus | `:focus-visible` on buttons/chips/switch; inputs use `:focus` | Headings take focus on screen change |

Dynamic nodes go through `el()`; names never `innerHTML`.

## TODOs (not locked)

- [ ] **Spacing scale** — tokens exist; many raw values remain (`3px`, `2px`, `0.1rem`, `1.75rem`, `4.5rem`). Decide: tokens-only vs documented exceptions.
- [ ] **Accent** — dark `#5b8def` vs light `#3b6fd9`; primary button and logo also hardcode `#4a7de0` / `#34d399`. Pick one pair and drive all accents from tokens.
- [ ] **Dialog / focus trap** — leave-session and clear-stats use `window.confirm`. No modal, no `inert`, no trap. Overlay does not lock background focus.
- [ ] **Touch targets** — `.btn--icon` is 2.5rem (40px); toast close is 1.5rem; chips/presets pad `--space-2`. 44px minimum is not specified.
- [ ] **Manifest chrome** — `theme_color` / `background_color` do not follow light theme.
- [ ] **Type** — Google Fonts (network, CSP `fonts.googleapis.com` / `fonts.gstatic.com`) vs system stack only.
- [ ] **Z-index / overlay** — header 50, footer 20, toasts 200; no scale. Loading overlay is not a focus-trapping layer.
