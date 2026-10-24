# Progress and features

Source of truth for **what the code does now**. Checkboxes: `[x]` implemented, `[ ]` not in the tree. Do not mark a box until the behavior exists.

When you ship an item here, flip it in the same run ([AGENTS.md](AGENTS.md)). Visual notes: [design-code.md](design-code.md).

## Core loop

- [x] Settings → memorize → recall → results
- [x] Play again with the same settings (new faces/names)
- [x] Practice-mistakes round (reuse last missed people)
- [x] Free-text recall (diacritic/case-insensitive match)
- [x] Dropdown recall (shuffled name list)
- [x] First-letter hints on recall
- [x] Shuffle order after memorize (optional)
- [x] Layout: tiles or single column
- [x] Name position: above or under the face
- [x] Optional timer: total seconds **or** seconds × faces; optional UI + progress bar; auto-advance to recall at 0
- [x] Image preload; failed portraits fall back to initials SVG
- [x] Loading overlay while generating/preloading
- [x] Keyboard: `Esc` leave, `M` ready, `C` check; Enter advances recall fields
- [x] Optional confirm-leave mid-session (`beforeunload` + `confirm`)
- [x] Green/red card flash before results; score ring + mistake list

## Settings & presets

- [x] People count 2–30 (default 8)
- [x] Regions: American, West EU, East EU (at least one required)
- [x] Gender filter: all / male / female
- [x] Presets: easy, medium, hard, expert
- [x] Auto-persist valid form changes to `nfmt-settings`

## Data (names + faces)

- [x] `data/names/american.json`, `west-eu.json`, `east-eu.json` (`male` / `female`)
- [x] Faces from randomuser.me portraits (`men`/`women` 0–99)
- [x] Unique face index per gender when possible; name reuse if the pool is smaller than `count`
- [x] Name JSON cached in memory; 12s fetch timeout
- [ ] More name regions / datasets
- [ ] Optional personal photo upload (local only)

## Localization

- [x] EN, DE, UA, PL (`locales/*.json`)
- [x] Saved language + browser-language fallback
- [x] `[data-i18n]`, `[data-i18n-aria]`, `[data-i18n-title-only]` + `{var}` in `t()`
- [x] `npm run check:locales` (key parity with `en.json`)

## Theme & a11y

- [x] Dark / light; system preference until the user toggles
- [x] `js/boot.js` applies theme before CSS paint
- [x] `aria-live` announcements on screen changes and results
- [x] Focus moves to the new screen heading (or first recall input)
- [x] Toasts instead of `alert()` for most feedback
- [x] `prefers-reduced-motion` (CSS + shorter grade delay)
- [x] Document CSP; `el()` for dynamic UI
- [x] Offline / online toasts

## Stats & storage

- [x] `nfmt-stats`: history (max 100), streak, best %, totals
- [x] Stats screen: sessions, avg, best, streak, best streak, accuracy, faces, last-5 avg
- [x] Sparkline of last 12 scores; last 20 sessions listed
- [x] Export JSON / import merge / clear (clear uses `confirm`)
- [x] Practice and timed badges on history rows
- [x] Keys: `nfmt-settings`, `nfmt-stats`, `nfmt-theme`, `nfmt-lang` only

## PWA

- [x] `manifest.webmanifest` (standalone, SVG icon)
- [x] Service worker: precache app shell + locales + name JSON
- [x] Stale-while-revalidate for same-origin GET
- [x] Face CDN is **not** cached; new faces need network
- [x] Register SW only on http(s)

## Known gaps / not yet

- [ ] Spaced-repetition long-term schedule
- [ ] Optional personal photo upload (local only)
- [ ] More name regions / datasets
- [ ] Custom dialogs (leave + clear stats still use `window.confirm`; no focus trap)
- [ ] Unit tests — **removed**. `tests/` and `npm test` are gone; `coverage/` is no longer gitignored. Locale checker remains.

Face images and Google Fonts need network. The offline shell still loads; portraits may show initials fallbacks.
