export const C = {
  bg:        '#0d0f14',
  card:      '#161b26',
  cardAlt:   '#1e2433',
  border:    'rgba(255,255,255,0.07)',
  blue:      '#3b82f6',
  blueLight: 'rgba(59,130,246,0.15)',
  orange:    '#f97316',
  orangeLight:'rgba(249,115,22,0.15)',
  green:     '#22c55e',
  greenLight:'rgba(34,197,94,0.15)',
  red:       '#ef4444',
  redLight:  'rgba(239,68,68,0.12)',
  textPri:   '#f0f2f5',
  textSec:   'rgba(240,242,245,0.5)',
  textMut:   'rgba(240,242,245,0.28)',
}

export const DEFAULT_GOAL   = 'Finish the most important task of the day'
export const DEFAULT_TINY   = 'Work for just 5 minutes - no pressure, just begin.'
export const defaultTasks   = [
  { id: 1, text: 'Pick one useful task', done: false },
  { id: 2, text: 'Clear one small area', done: false },
  { id: 3, text: 'Do one 10-minute focus sprint', done: false },
]
export const DURATIONS = [
  { label: '5 min',  seconds: 5  * 60, pts: 3 },
  { label: '10 min', seconds: 10 * 60, pts: 3 },
  { label: '15 min', seconds: 15 * 60, pts: 4 },
  { label: '20 min', seconds: 20 * 60, pts: 4 },
  { label: '25 min', seconds: 25 * 60, pts: 5 },
  { label: '30 min', seconds: 30 * 60, pts: 6 },
]
export const DEFAULT_REWARDS = [
  { id: 1, name: 'YouTube', emoji: '📺', cost: 3 },
  { id: 2, name: 'Music', emoji: '🎵', cost: 2 },
  { id: 3, name: 'Gaming', emoji: '🎮', cost: 6 },
]
export const SKIP_MESSAGES = [
  "That's okay. Tomorrow is fresh.",
  "Rest is part of the process.",
  "No shame. You showed up anyway.",
  "Skipping is not failing. Keep going.",
  "Every day is a new chance.",
]
