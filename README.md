# MLBB Fighter Encyclopedia

A comprehensive web reference for **Mobile Legends: Bang Bang** Fighter heroes — built with vanilla HTML, CSS, and JavaScript. No frameworks, no build tools, just open `index.html`.

## Features

- **Encyclopedia** — All 32 Fighter heroes with tier ratings, portraits, strengths, weaknesses, builds, and counters
- **Counter Picker** — Input 2–5 enemy heroes and get ranked Fighter recommendations based on their composition
- **Draft Mode** — First Pick (safe/versatile) vs Second Pick (direct counter) recommendation logic
- **ML Rating System** — Community ▲/▼ voting that adjusts recommendation scores over time and persists across sessions

## Project Structure

```
index.html          # Entry point — pure HTML markup, no inline CSS or JS
src/
├── css/
│   └── styles.css  # All styling — layout, cards, modal, counter picker, rating widget
└── js/
    ├── rating.js   # ML feedback engine — persistent vote weights via window.storage
    ├── data.js     # Hero data — HEROES, ALL_HEROES, FIGHTER_DATA, ENEMY_TRAITS
    └── app.js      # App logic — filtering, rendering, modal, counter scoring, picker UI
```

## Usage

Clone the repo and open `index.html` directly in a browser — no server required.

```bash
git clone https://github.com/your-username/mlbb-fighter-encyclopedia.git
cd mlbb-fighter-encyclopedia
open index.html   # or double-click it
```

To host on GitHub Pages, just push to a repo and enable Pages from the `main` branch root.

## Script Load Order

The scripts must be loaded in this order (already set in `index.html`):

1. `rating.js` — defines `applyWeight`, `getWeight`, `castVote`, etc.
2. `data.js`   — defines `HEROES`, `ALL_HEROES`, `FIGHTER_DATA`, `ENEMY_TRAITS`
3. `app.js`    — consumes all of the above

## Data Sources

Hero info compiled from official MLBB patch notes, [mlcounter.com](https://mlcounter.com), and community tier lists. Hero portraits served from mlcounter.com. Not affiliated with MOONTON Games.

## License

BSD 2-Clause
