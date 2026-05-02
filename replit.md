# FocusForge

A lightweight productivity app built with React + Vite that helps users manage tasks, track habits, and stay focused using a gamified points/rewards system.

## Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Styling:** Inline styles with a custom design token object
- **Persistence:** localStorage

## Project Structure

```
/
├── App.jsx          # Main application component (all logic + UI)
├── main.jsx         # React root entry point
├── index.html       # HTML shell
├── vite.config.js   # Vite config (host: 0.0.0.0, port: 5000, allowedHosts: true)
├── package.json     # Dependencies and scripts
└── replit.md        # This file
```

## Features

- **Points System** — earn points by completing tasks and focus sessions
- **Today Tab** — Main Goal, Tiny Start, Top 3 tasks, Next Reward preview, Start New Day reset
- **Focus Timer** — configurable 5/10/25 min timer with visual progress ring and sound/haptic feedback
- **Goals Tab** — Add/edit/delete goals with Why/TinyStep/MinWin/Backup fields and Break It Down steps
- **Habit Tracker** — daily streaks with Full/Partial/Skip options
- **Rewards Shop** — fully customizable rewards with emoji, name, and point cost
- **Persistence** — all data saved in localStorage (ff_ prefix)
- **Input Validation** — blank name checks and cost >= 1 enforced with inline error messages
- **Footer Disclaimer** — legal disclaimer shown on every tab

## Running the App

```bash
npm run dev   # starts on 0.0.0.0:5000
```

## Deployment

Configured as a static site (Vite SPA):
- Build command: `npm run build`
- Public dir: `dist`
