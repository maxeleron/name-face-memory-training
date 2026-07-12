# Name-Face Memory Training

**Train your ability to remember names and faces — the most useful memory skill in real life.**

A clean, free, open-source web app that helps you deliberately practice associating faces with names.  
Fully customizable, privacy-first, and ready for different languages and cultures.

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

1. **Settings screen** — choose how hard you want the training to be.
2. **Memorize phase** — you see a set of faces with names (above or under the photo).
3. **Recall phase** — the names disappear. You try to write (or select) the correct name for each face.
4. **Results** — see your score and try again.

---

## Features & Customization

### Core Training Loop
- Show generated faces + names
- Memorize them
- Recall by typing or selecting names

### Full Control Over Difficulty & Style

| Setting | Options | Description |
|---------|---------|-------------|
| **Number of people** | Slider 2 – 30 | How many faces you want to memorize |
| **Name regions** | American · West EU · East EU | Toggle which name datasets to use (multi-select supported) |
| **Gender** | Male · Female · All | Filter faces by sex (default: All) |
| **Layout** | Column · Tiles (grid) | How faces are displayed |
| **Name position** | Above image · Under image | Where the name appears during memorization |
| **Shuffle after memorize** | On · Off | Whether faces change order in the recall phase |
| **Timer** | Custom duration + Show/Hide | Optional countdown. When time is up → automatic switch to recall |
| **Input method** | Free text · Dropdown | Choose before starting: type the name or select from list |

### Localization (ready)
- English (EN)
- German (DE)
- Ukrainian (UA)
- Polish (PL)

The app is pre-structured for easy translation. Language selector will be available.

---

## Tech Stack & Philosophy

**Stack (v1)**  
- Pure **Vanilla HTML + CSS + JavaScript**  
- No frameworks, no build tools required  
- Extremely lightweight and easy to contribute to  

**Key principles**
- Privacy first — everything stays in the browser (localStorage only)
- Offline-friendly design
- Modular code so new features and languages are easy to add
- Open source and free forever

### Planned project structure
```
name-face-memory-training/
├── index.html
├── css/
│   └── style.css
├── js/
│   ├── app.js
│   ├── settings.js
│   ├── game.js
│   ├── data.js
│   ├── i18n.js
│   └── utils.js
├── data/
│   ├── names/
│   │   ├── american.json
│   │   ├── west-eu.json
│   │   └── east-eu.json
│   └── faces/                  # or loaded via free AI-face API
├── locales/
│   ├── en.json
│   ├── de.json
│   ├── ua.json
│   └── pl.json
└── README.md
```

### Data Sources
- **Faces**: AI-generated realistic faces (free sources such as Generated.photos / 100k-faces style APIs or a small local pack). Fully synthetic → no privacy or copyright issues.
- **Names**: Curated popular first names by region (American, Western European, Eastern European) based on public open datasets (CC0).

---

## Getting Started

1. Clone the repository
   ```bash
   git clone https://github.com/maxeleron/name-face-memory-training.git
   cd name-face-memory-training
   ```

2. Open `index.html` in your browser  
   (or use any local server: `npx serve .` / Live Server, etc.)

That’s it. No installation, no dependencies.

---

## Roadmap (ideas)

- [x] Core concept & full customization options defined
- [ ] Basic working prototype (vanilla JS)
- [ ] Name datasets for American / West EU / East EU
- [ ] Localization files (EN, DE, UA, PL)
- [ ] Timer + show/hide option
- [ ] Free-text + dropdown input modes
- [ ] Beautiful, modern, mobile-first UI
- [ ] Progress statistics (localStorage)
- [ ] Spaced repetition mode
- [ ] Personal photo upload (local only)
- [ ] Dark / Light theme
- [ ] PWA support (installable + offline)

---

## Contributing

Contributions are very welcome!

Ideas that help a lot:
- Better name lists
- More realistic face sources
- Translations
- UI/UX improvements
- Accessibility
- New training modes

Just open an issue or pull request.

---

## License

GNU General Public License v3.0  
See [LICENSE](LICENSE) for details.

---

**Made for people who want to get better at remembering names — one face at a time.**

Feel free to star the repo if you find it useful! ⭐
