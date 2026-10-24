# AGENTS.md

Privacy-first web app that trains name–face memory. Vanilla HTML/CSS/JS (ES modules), PWA shell, `localStorage` only. No bundler, no accounts, no server of our own.

**Status:** [progress-and-features.md](progress-and-features.md) · **Visual:** [design-code.md](design-code.md)

## Stack

| Piece | What |
|---|---|
| UI | `index.html` + `css/style.css` + ES modules under `js/` |
| Persistence | `localStorage` keys `nfmt-settings`, `nfmt-stats`, `nfmt-theme`, `nfmt-lang` |
| Faces | `https://randomuser.me/api/portraits/{men\|women}/{0–99}.jpg` |
| Names | `data/names/{american,west-eu,east-eu}.json` (`male` / `female` arrays) |
| i18n | `locales/{en,de,ua,pl}.json` |
| PWA | `manifest.webmanifest` + `sw.js` (shell cache `nfmt-v2`; CDN faces uncached) |
| CSP | document-level in `index.html` |

## Commands

```bash
npm start              # static server → http://localhost:5173
npm run check:locales  # locale key parity vs en.json; run before every commit
```

Open `index.html` only if you must; modules and the service worker expect http(s).

## Key files

| Path | Responsibility |
|---|---|
| `index.html` | Screens, settings form, CSP, PWA links |
| `css/style.css` | Tokens, themes, components |
| `js/boot.js` | Pre-module theme (no FOUC); keep CSP-safe (no inline) |
| `js/app.js` | Screen wiring, presets, stats UI, shortcuts, SW register |
| `js/game.js` | Memorize → recall → results; timer; grading; practice-mistakes |
| `js/settings.js` | Form read/write, validate, persist, presets (`easy`/`medium`/`hard`/`expert`) |
| `js/stats.js` | Session history (max 100), streak, export/import/clear |
| `js/data.js` | Name load/cache, `faceUrl()`, `generatePeople()`, image preload |
| `js/i18n.js` | Load locale JSON, `[data-i18n*]`, `{var}` interpolate |
| `js/theme.js` | Light/dark + system fallback |
| `js/toast.js` | Non-blocking toasts |
| `js/announce.js` | `aria-live` announcements |
| `js/utils.js` | shuffle/sample, name match, `storage`, `el()`, avatar fallback |
| `locales/` | `en` is canonical; `de` `ua` `pl` must match keys |
| `data/names/` | Curated first names by region |
| `sw.js` | Precache list + stale-while-revalidate for same-origin |
| `scripts/check-locales.js` | Key-set checker |

Screens: `settings` → `memorize` → `recall` → `results`; `stats` is a sibling. Shortcuts: `Esc` leave · `M` ready · `C` check.

## Hard rules

- No frameworks, no bundler, no build step, no analytics, no accounts, no backend.
- Privacy first: only `localStorage`; never send settings/stats/faces/names off-device.
- New UI strings: add the key to **all four** locale files (`en`, `de`, `ua`, `pl`). `en.json` is the source of truth.
- Run `npm run check:locales` before committing. Fix missing/extra keys; do not skip.
- Do not change `faceUrl()` / randomuser.me portrait URLs without a concrete reason (broken CDN, license, or an explicit task).
- New same-origin assets used at runtime go on the `sw.js` `PRECACHE` list (and bump `CACHE` if the old shell would be stale).
- New languages: `js/i18n.js` `SUPPORTED`, `#langSelect` in `index.html`, locale JSON, `sw.js` precache.
- Dynamic DOM: use `el()` / `textContent`. Do not inject unsanitized HTML.
- Confirm dialogs today are `window.confirm` (leave session, clear stats). Do not add a modal library.
- When you finish a feature listed in [progress-and-features.md](progress-and-features.md), flip its checkbox in the **same run**.
