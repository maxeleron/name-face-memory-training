# Name-Face Memory Training

**Train your ability to remember names and faces — the most useful memory skill in real life.**

A clean, free, open-source web app that helps you deliberately practice associating faces with names.  
Fully customizable, privacy-first, installable as a PWA, and ready for different languages and cultures.

---

## Why this project exists

Most people struggle to remember names.  
We believe this skill is **trainable** — not a fixed talent.

This tool is built on three simple ideas:

1. **Practice with realistic faces** — not abstract cards.
2. **Train with names that matter to you** — American, Western European or Eastern European names.
3. **Give the user full control** — how many faces, layout, timer, input method, gender, etc.

Everything runs 100% in your browser. No accounts, no tracking, no cloud storage of your data.

---

## How it works

1. **Settings** — choose difficulty (or use a quick preset).
2. **Memorize** — study faces with names (optional countdown).
3. **Recall** — type or select the name for each face.
4. **Results** — score, mistakes review, optional “practice mistakes” round.
5. **Stats** — local history, streak, averages (export/import anytime).

---

## Features

### Core training
- Generated faces + curated first-name datasets
- Free-text or dropdown recall
- Shuffle after memorize, layout (tiles / column), name position
- Optional timer (total or per-face) with progress bar
- First-letter hints for easier practice
- Practice only the faces you missed

### Progress (local only)
- Session history with sparkline trend
- Daily streak, best score, overall accuracy
- Export / import JSON; clear anytime

### UX & accessibility
- Dark / light theme (system-aware)
- EN · DE · UA · PL localization
- Keyboard shortcuts: `Esc` leave · `M` ready · `C` check
- Screen-reader announcements, focus management
- Toast notifications instead of blocking alerts
- Offline-ready app shell (PWA); face images need network

### Privacy & security
- No accounts, no analytics
- `localStorage` only for settings, theme, language, stats
- Content-Security-Policy on the document
- Safe DOM construction for dynamic UI

---

## Quick start

```bash
git clone https://github.com/maxeleron/name-face-memory-training.git
cd name-face-memory-training
```

**Option A — open directly**  
Open `index.html` in a modern browser (modules require a local server in some browsers).

**Option B — local server (recommended)**

```bash
npm start
# → http://localhost:5173
```

No install required for the app itself (`npm start` only pulls a static server).

---

## Development

```bash
npm test              # unit tests (Node)
npm run check:locales # ensure locale key parity with en.json
npm start             # static server on :5173
```

### Project structure

```
name-face-memory-training/
├── index.html
├── favicon.svg
├── manifest.webmanifest
├── sw.js                 # service worker (shell cache)
├── css/style.css
├── js/
│   ├── boot.js           # pre-module theme (no FOUC)
│   ├── app.js            # wiring / screens
│   ├── game.js           # memorize → recall → results
│   ├── data.js           # names + face URLs
│   ├── settings.js       # form + presets
│   ├── stats.js          # local progress
│   ├── i18n.js
│   ├── theme.js
│   ├── toast.js
│   ├── announce.js
│   └── utils.js
├── data/names/           # american, west-eu, east-eu
├── locales/              # en, de, ua, pl
├── tests/
└── scripts/check-locales.js
```

### Data sources
- **Faces**: [randomuser.me](https://randomuser.me) portrait CDN (synthetic-style stock photos). Offline shell still works; new faces need network. Failed images fall back to initials avatars.
- **Names**: Curated popular first names by region (public/open-style lists).

---

## Tech stack & principles

- Pure **Vanilla HTML + CSS + JavaScript** (ES modules)
- No frameworks, no bundler required
- PWA: web app manifest + service worker
- Privacy first, offline-friendly shell, modular code

---

## Roadmap

- [x] Core training loop + full settings
- [x] Name datasets (American / West EU / East EU)
- [x] Localization (EN, DE, UA, PL)
- [x] Timer + free-text / dropdown modes
- [x] Dark / light theme
- [x] Progress statistics (localStorage)
- [x] Practice-mistakes mode
- [x] Difficulty presets
- [x] PWA (installable + offline shell)
- [x] Unit tests + locale checker
- [ ] Spaced-repetition long-term schedule
- [ ] Optional personal photo upload (local only)
- [ ] More name regions / datasets

---

## Contributing

Contributions are very welcome:

- Better name lists and translations
- Accessibility and UX polish
- New training modes
- Face-source improvements (still privacy-safe)

Open an issue or pull request.

---

## License

GNU General Public License v3.0  
See [LICENSE](LICENSE) for details.
