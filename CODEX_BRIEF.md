# FocusForge Codex Brief

## What FocusForge is

FocusForge is an ADHD-friendly focus, goals, habits, rewards, and recovery app.

It is designed as a daily command center that helps users answer one question quickly:

> What should I do next?

The product should reduce overwhelm, not create another complicated productivity dashboard.

## Current product loop

The core loop is:

1. User opens Today
2. App shows one Next Best Action
3. User starts tiny or starts focus
4. User completes a focus session, task, habit, or partial win
5. User earns points
6. User claims a personal reward
7. If overwhelmed, user uses Restart My Day

Everything should support this loop.

## Current app status

This is a published private MVP.

Current features include:

- Today tab
- Focus tab
- Goals tab
- Habits tab
- Rewards tab
- Custom rewards
- Editable tasks
- Editable main goal
- Tiny Start
- Next Best Action
- Focus timer
- Focus task selection
- Timer persistence using localStorage and timestamp-based end time
- Partial win / end early
- Restart My Day flow
- Start New Day
- Export/import localStorage data
- PWA manifest and install metadata
- Footer disclaimer

## Tech stack

- React
- Vite
- Plain inline styles
- localStorage for persistence
- No backend yet
- No login yet
- No MongoDB yet
- No AI API yet

## Files

Main files:

- `App.jsx` contains the full app UI and logic
- `main.jsx` mounts the React app
- `index.html` includes PWA metadata
- `manifest.json` contains PWA install settings
- `icon.svg` is a placeholder app icon
- `package.json` contains Vite scripts

## Design direction

Keep the app:

- Dark mode first
- Mobile-first
- Calm but motivating
- Blue/orange accent system
- Clear, direct, low-friction
- Not childish
- Not clinical
- No shame language
- No streak punishment

## Important ADHD UX rules

1. Reduce visible choices on Today.
2. The Today page should not feel cluttered.
3. Always make the next action obvious.
4. Avoid long forms when possible.
5. Hide secondary controls in collapsible sections.
6. Reward personal progress, not perfection.
7. Partial wins are allowed.
8. Recovery flows are important.
9. Avoid guilt, shame, or failure language.
10. If the user is stuck, offer a smaller action.

## Current concern

The Today page feels cluttered and overwhelming.

It currently shows too much at once:

- Points banner
- Next Best Action
- Instruction copy
- Main Goal
- Tiny Start
- Top 3 Tasks
- Next Reward
- Start Focus Session
- Start New Day
- Restart My Day
- Settings
- Export/import
- Danger Zone

The next recommended change is to simplify Today using progressive disclosure.

## Recommended next task

Simplify the Today page.

Keep these always visible:

1. Next Best Action
2. Tiny Start
3. Top 3 Tasks
4. Restart My Day

Move these into a collapsible section called `More options`:

- Today's Points
- Main Goal
- Next Reward
- Start Focus Session, if redundant
- Start New Day
- Settings
- Export Data
- Import Data
- Danger Zone / Reset all data

Keep all functionality working.

## Things not to do yet

Do not add:

- Backend
- Login/signup
- MongoDB
- AI goal breakdown API
- Payments
- App Store packaging
- Major redesign
- New feature bloat

## Next engineering priorities

1. Simplify Today page layout
2. Split `App.jsx` into components later, but not before the Today simplification
3. Keep the current app stable
4. Add README improvements if needed
5. Only add backend after real user feedback proves sync is needed

## Testing checklist

After changes, verify:

- App loads
- Today page is calmer
- Next Best Action works
- Tiny Start works
- Task Focus button works
- Timer starts
- Timer survives tab switching
- Timer survives refresh
- Timer claim works once
- End early adds only one point
- Rewards add/edit/delete/claim work
- Start New Day works
- Restart My Day works
- Export downloads JSON
- Import restores JSON
- Reset all data works
- `npm run build` passes

## Build commands

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build:

```bash
npm run build
```

## First Codex prompt to use

Simplify the Today page to reduce overwhelm.

Do not remove features.
Do not rewrite the whole app.
Use progressive disclosure.

On the Today tab, keep these sections always visible:

1. Next Best Action
2. Tiny Start
3. Top 3 Tasks
4. Restart My Day

Move these sections into a collapsible panel called `More options`:

- Today's Points
- Main Goal
- Next Reward
- Start New Day
- Settings
- Export Data
- Import Data
- Danger Zone / Reset all data

Keep all existing functionality working.

Also:

- Keep the active timer indicator in the header
- Keep the footer disclaimer
- Keep dark mode
- Keep mobile-first layout
- Make the Today page feel calmer and more action-focused
- Make sure `npm run build` works
