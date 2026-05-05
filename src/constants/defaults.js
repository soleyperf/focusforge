export const DEFAULT_GOAL = 'Finish the most important task of the day'
export const DEFAULT_TINY = 'Work for just 5 minutes - no pressure, just begin.'
export const defaultTasks = [
  { id: 1, text: 'Pick one useful task', done: false },
  { id: 2, text: 'Clear one small area', done: false },
  { id: 3, text: 'Do one 10-minute focus sprint', done: false },
]
export const DEFAULT_REWARDS = [
  { id: 1, name: 'YouTube', emoji: '📺', cost: 3 },
  { id: 2, name: 'Music', emoji: '🎵', cost: 2 },
  { id: 3, name: 'Gaming', emoji: '🎮', cost: 6 },
]
export const SKIP_MESSAGES = [
  "That's okay. Tomorrow is fresh.",
  'Rest is part of the process.',
  'No shame. You showed up anyway.',
  'Skipping is not failing. Keep going.',
  'Every day is a new chance.',
]

export function hasCustomTasks(savedTasks) {
  if (!Array.isArray(savedTasks) || savedTasks.length === 0) return false
  if (savedTasks.length !== defaultTasks.length) return true
  return savedTasks.some((task, i) => (task.text || '').trim() !== defaultTasks[i].text)
}
