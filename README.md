# MLBB Fighters Encyclopedia (React + Vite)

## Overview
MLBB Fighters Encyclopedia is a React-based web application that provides detailed information about Fighter heroes and helps players determine the best counter picks against enemy compositions.

The application combines an interactive hero encyclopedia with a counter recommendation system, allowing users to both explore hero data and make strategic decisions during gameplay.

## Features
- **Encyclopedia Tab**
  - Browse all Fighter heroes
  - Search heroes by name, role, or specialization
  - Filter by tier and lane (EXP / Jungle)
  - Sort by tier or alphabetical order
  - View detailed hero information in a modal

- **Counter Tab**
  - Select enemy heroes using a picker modal
  - Choose draft mode (First Pick / Second Pick)
  - Get ranked counter recommendations
  - View reasons why a hero is effective
  - Inspect hero details directly from results

- **Hero Details**
  - Tier classification (S, A, B, C)
  - Roles and lanes
  - Strengths and weaknesses
  - Recommended builds
  - Countered heroes

## Tech Stack
- **React 18**
- **Vite** (for fast development and build)
- **JavaScript (ES Modules)**
- **Inline CSS styling (custom UI system)**

## Project Structure
src/
│── App.jsx # Main app container and tab switching
│── main.jsx # Entry point
│
├── components/
│ ├── EncyclopediaTab.jsx # Hero encyclopedia UI
│ ├── CounterTab.jsx # Counter recommendation system
│ ├── HeroCard.jsx # Hero card with hover effects
│ ├── HeroModal.jsx # Hero detail modal
│ ├── HeroPickerModal.jsx # Enemy hero selection modal
│ └── ui/
│ ├── HeroAvatar.jsx
│ ├── RolePill.jsx
│ └── TierBadge.jsx
│
├── data/
│ └── heroes.js # Hero dataset
│
├── utils/
│ ├── counter.js # Counter scoring algorithm
│ └── helpers.js # Colors and helper functions

## Core Logic
The counter system evaluates heroes using a scoring algorithm based on:

- Enemy traits (e.g. mobile, burst, tank)
- Hero counter tags and avoid tags
- Tier-based bonuses
- Draft mode adjustments (First Pick vs Second Pick)

Each recommended hero is scored and ranked dynamically based on the selected enemy composition.

## Installation

```bash
git clone https://github.com/your-username/your-repo.git
cd your-repo
npm install
