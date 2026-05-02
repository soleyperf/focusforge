# FocusForge

A lightweight productivity app built with React + Vite that helps users manage tasks, track habits, and stay focused using a gamified points/rewards system.

## Tech Stack

- **Framework:** React
- **Build Tool:** Vite
- **Icons:** lucide-react
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
- **Daily Goals** — Main Goal + Tiny Start to lower the barrier to productivity
- **Focus Timer** — configurable 5/10/25 min timer with visual progress ring
- **Habit Tracker** — daily streaks with Full/Partial/Skip options
- **Rewards Shop** — spend points on custom rewards
- **Persistence** — all data saved in localStorage

## Running the App

```bash
npm run dev   # starts on 0.0.0.0:5000
```

## Deployment

Configured as a static site (Vite SPA):
- Build command: `npm run build`
- Public dir: `dist`
