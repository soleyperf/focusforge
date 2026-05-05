import { useState, useEffect, useRef } from 'react'

/* -- Persistence helpers -- */
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/* -- Design tokens -- */
const C = {
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

const DEFAULT_GOAL   = 'Finish the most important task of the day'
const DEFAULT_TINY   = 'Work for just 5 minutes - no pressure, just begin.'
const defaultTasks   = [
  { id: 1, text: 'Pick one useful task', done: false },
  { id: 2, text: 'Clear one small area', done: false },
  { id: 3, text: 'Do one 10-minute focus sprint', done: false },
]
const DURATIONS = [
  { label: '5 min',  seconds: 5  * 60, pts: 3 },
  { label: '10 min', seconds: 10 * 60, pts: 3 },
  { label: '15 min', seconds: 15 * 60, pts: 4 },
  { label: '20 min', seconds: 20 * 60, pts: 4 },
  { label: '25 min', seconds: 25 * 60, pts: 5 },
  { label: '30 min', seconds: 30 * 60, pts: 6 },
]
function todayKey() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
const DEFAULT_REWARDS = [
  { id: 1, name: 'YouTube', emoji: '📺', cost: 3 },
  { id: 2, name: 'Music', emoji: '🎵', cost: 2 },
  { id: 3, name: 'Gaming', emoji: '🎮', cost: 6 },
]
const SKIP_MESSAGES = [
  "That's okay. Tomorrow is fresh.",
  "Rest is part of the process.",
  "No shame. You showed up anyway.",
  "Skipping is not failing. Keep going.",
  "Every day is a new chance.",
]

function hasCustomTasks(savedTasks) {
  if (!Array.isArray(savedTasks) || savedTasks.length === 0) return false
  if (savedTasks.length !== defaultTasks.length) return true
  return savedTasks.some((task, i) => (task.text || '').trim() !== defaultTasks[i].text)
}

function initialSetupComplete() {
  const stored = load('ff_setupComplete', null)
  if (stored !== null) return !!stored
  return hasCustomTasks(load('ff_tasks', null))
}

export default function App() {
  const [points, setPoints] = useState(() => load('ff_points', 0))
  const [tab, setTab] = useState('today')
  const [tasks, setTasks] = useState(() => load('ff_tasks', defaultTasks))
  const [tinyDone, setTinyDone] = useState(() => load('ff_tinyDone', false))
  const [mainGoal, setMainGoal] = useState(() => load('ff_mainGoal', DEFAULT_GOAL))
  const [tinyText, setTinyText] = useState(() => load('ff_tinyText', DEFAULT_TINY))
  const [habits, setHabits] = useState(() => load('ff_habits', []))
  const [rewards, setRewards] = useState(() => load('ff_rewards', DEFAULT_REWARDS))
  const [goals, setGoals] = useState(() => load('ff_goals', []))
  const [restartOpen, setRestartOpen] = useState(false)
  const [restarted, setRestarted] = useState(false)
  const [setupComplete, setSetupComplete] = useState(initialSetupComplete)
  const [setupOpen, setSetupOpen] = useState(false)
  const [dayKey, setDayKey] = useState(() => load('ff_dayKey', todayKey()))
  const [moveTasksToTomorrow, setMoveTasksToTomorrow] = useState(() => load('ff_moveTasksToTomorrow', false))
  const [focusTask, setFocusTask] = useState(() => load('ff_focusTask', null))
  const [timerSelected, setTimerSelected] = useState(() => {
    const s = load('ff_timer', null)
    return (s && DURATIONS.find(d => d.label === s.selectedLabel)) || DURATIONS.find(d => d.label === '25 min')
  })
  const [timerEndAt, setTimerEndAt] = useState(() => {
    const s = load('ff_timer', null)
    return (s && s.running && s.endAt && s.endAt > Date.now()) ? s.endAt : null
  })
  const [timerLeft, setTimerLeft] = useState(() => {
    const s = load('ff_timer', null)
    if (!s) return null
    if (s.running && s.endAt) return Math.max(0, Math.ceil((s.endAt - Date.now()) / 1000))
    return s.left ?? null
  })
  const [timerRunning, setTimerRunning] = useState(() => {
    const s = load('ff_timer', null)
    return !!(s && s.running && s.endAt && s.endAt > Date.now())
  })
  const [timerCompleted, setTimerCompleted] = useState(() => {
    const s = load('ff_timer', null)
    if (!s) return false
    if (s.running && s.endAt && s.endAt <= Date.now()) return true
    return s.completed || false
  })
  const [timerClaimed, setTimerClaimed] = useState(() => {
    const s = load('ff_timer', null)
    return !!(s && s.claimed)
  })
  const [timerPartial, setTimerPartial] = useState(() => {
    const s = load('ff_timer', null)
    return !!(s && s.partial)
  })
  const [feedbackOn, setFeedbackOn] = useState(() => load('ff_feedbackOn', true))
  const timerRef = useRef(null)
  const timerSoundFired = useRef(false)
  const importRef = useRef()

  useEffect(() => save('ff_points', points), [points])
  useEffect(() => save('ff_tasks', tasks), [tasks])
  useEffect(() => save('ff_tinyDone', tinyDone), [tinyDone])
  useEffect(() => save('ff_mainGoal', mainGoal), [mainGoal])
  useEffect(() => save('ff_tinyText', tinyText), [tinyText])
  useEffect(() => save('ff_habits', habits), [habits])
  useEffect(() => save('ff_rewards', rewards), [rewards])
  useEffect(() => save('ff_goals', goals), [goals])
  useEffect(() => save('ff_feedbackOn', feedbackOn), [feedbackOn])
  useEffect(() => save('ff_focusTask', focusTask), [focusTask])
  useEffect(() => save('ff_setupComplete', setupComplete), [setupComplete])
  useEffect(() => save('ff_dayKey', dayKey), [dayKey])
  useEffect(() => save('ff_moveTasksToTomorrow', moveTasksToTomorrow), [moveTasksToTomorrow])
  useEffect(() => {
    const currentDay = todayKey()
    const savedDay = load('ff_dayKey', currentDay)
    const shouldCarry = load('ff_moveTasksToTomorrow', false)
    if (savedDay === currentDay) return
    if (shouldCarry) {
      setTasks(prev => prev.map(t => ({ ...t, done: false })))
      setTinyDone(false)
      setHabits(prev => prev.map(h => ({ ...h, todayStatus: null, skipMsg: null })))
      setMoveTasksToTomorrow(false)
      setRestarted(false)
      setRestartOpen(false)
    } else {
      clearInterval(timerRef.current)
      setTasks(defaultTasks)
      setMainGoal(DEFAULT_GOAL)
      setTinyText(DEFAULT_TINY)
      setTinyDone(false)
      setFocusTask(null)
      setSetupComplete(false)
      setSetupOpen(true)
      setRestarted(false)
      setRestartOpen(false)
      setTimerSelected(DURATIONS.find(d => d.label === '25 min')); setTimerEndAt(null); setTimerLeft(null)
      setTimerRunning(false); setTimerCompleted(false); setTimerClaimed(false); setTimerPartial(false)
    }
    setDayKey(currentDay)
  }, [])
  useEffect(() => {
    save('ff_timer', {
      selectedLabel: timerSelected.label,
      endAt: timerEndAt,
      left: timerLeft,
      running: timerRunning,
      completed: timerCompleted,
      claimed: timerClaimed,
      partial: timerPartial,
    })
  }, [timerSelected, timerEndAt, timerLeft, timerRunning, timerCompleted, timerClaimed, timerPartial])
  useEffect(() => {
    if (timerSoundFired.current) {
      if (timerCompleted && feedbackOn) {
        playCompletionSound()
        if (navigator.vibrate) navigator.vibrate([200, 80, 200, 80, 400])
      }
    } else {
      timerSoundFired.current = true
    }
  }, [timerCompleted])
  useEffect(() => {
    if (timerRunning && timerEndAt) {
      timerRef.current = setInterval(() => {
        const left = Math.max(0, Math.ceil((timerEndAt - Date.now()) / 1000))
        setTimerLeft(left)
        if (left <= 0) {
          clearInterval(timerRef.current)
          setTimerRunning(false)
          setTimerCompleted(true)
        }
      }, 500)
    }
    return () => clearInterval(timerRef.current)
  }, [timerRunning, timerEndAt])

  function startNewDay() {
    setTasks(prev => prev.map(t => ({ ...t, done: false })))
    setTinyDone(false)
    setHabits(prev => prev.map(h => ({ ...h, todayStatus: null, skipMsg: null })))
    setMoveTasksToTomorrow(false)
    setDayKey(todayKey())
    setRestarted(false)
    setRestartOpen(false)
  }

  function resetAllData() {
    if (!window.confirm('Reset all data? This cannot be undone.')) return
    ;['ff_points','ff_tasks','ff_tinyDone','ff_mainGoal','ff_tinyText','ff_habits','ff_rewards','ff_goals','ff_timer','ff_feedbackOn','ff_focusTask','ff_setupComplete','ff_dayKey','ff_moveTasksToTomorrow'].forEach(k => localStorage.removeItem(k))
    setPoints(0); setTasks(defaultTasks); setTinyDone(false)
    setMainGoal(DEFAULT_GOAL); setTinyText(DEFAULT_TINY)
    setHabits([]); setRewards(DEFAULT_REWARDS); setGoals([])
    setRestartOpen(false); setRestarted(false); setFocusTask(null)
    setSetupComplete(false); setSetupOpen(false); setTab('today')
    setDayKey(todayKey()); setMoveTasksToTomorrow(false)
    clearInterval(timerRef.current)
    setTimerSelected(DURATIONS.find(d => d.label === '25 min')); setTimerEndAt(null); setTimerLeft(null)
    setTimerRunning(false); setTimerCompleted(false); setTimerClaimed(false); setTimerPartial(false)
  }

  function moveTasksForward() {
    setMoveTasksToTomorrow(true)
    setRestartOpen(false)
    setRestarted(true)
  }

  function toggleTask(id) {
    setTasks(prev => prev.map(t => {
      if (t.id !== id) return t
      if (!t.done) setPoints(p => p + 3)
      else setPoints(p => Math.max(0, p - 3))
      return { ...t, done: !t.done }
    }))
  }

  function updateTaskText(id, text) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, text } : t))
  }

  function completeTiny() {
    if (!tinyDone) { setTinyDone(true); setPoints(p => p + 2) }
  }
  function selectDuration(label) {
    if (!timerRunning && !timerCompleted && timerLeft == null) {
      const duration = DURATIONS.find(d => d.label === label)
      if (duration) setTimerSelected(duration)
    }
  }
  function startFocus(task, durationLabel) {
    selectDuration(durationLabel)
    setFocusTask(task ? { id: task.id ?? Date.now(), text: task.text } : null)
    setTab('focus')
  }
  function rebuildToday() {
    setTasks(defaultTasks)
    setMainGoal(DEFAULT_GOAL)
    setTinyText(DEFAULT_TINY)
    setTinyDone(false)
    setFocusTask(null)
    setSetupComplete(false)
    setSetupOpen(true)
    setRestartOpen(false)
    setRestarted(false)
    clearInterval(timerRef.current)
    setTimerSelected(DURATIONS.find(d => d.label === '25 min')); setTimerEndAt(null); setTimerLeft(null)
    setTimerRunning(false); setTimerCompleted(false); setTimerClaimed(false); setTimerPartial(false)
    setMoveTasksToTomorrow(false)
    setTab('today')
  }
  function buildFocusPlan(taskTexts, mainText, tinyTaskText) {
    const clean = taskTexts.map(t => t.trim()).filter(Boolean)
    if (clean.length < 3) return
    const priority = mainText || clean[0]
    const tinyTask = tinyTaskText && tinyTaskText !== priority ? tinyTaskText : (clean.find(t => t !== priority) || clean[1] || priority)
    const ordered = [priority, tinyTask, ...clean.filter((text, i) => i !== clean.indexOf(priority) && i !== clean.indexOf(tinyTask))]
    const nextTasks = ordered.map((text, i) => ({ id: Date.now() + i, text, done: false }))
    setTasks(nextTasks)
    setMainGoal(priority)
    setTinyText(tinyTask)
    setTinyDone(false)
    setFocusTask({ id: nextTasks[0].id, text: priority })
    setSetupComplete(true)
    setSetupOpen(false)
    setRestartOpen(false)
    setRestarted(false)
    setTab('today')
  }
  const timerStart = () => {
    const endAt = Date.now() + timerSelected.seconds * 1000
    setTimerEndAt(endAt)
    setTimerLeft(timerSelected.seconds)
    setTimerCompleted(false)
    setTimerClaimed(false)
    setTimerRunning(true)
  }
  const timerPause = () => {
    clearInterval(timerRef.current)
    setTimerEndAt(null)
    setTimerRunning(false)
  }
  const timerResume = () => {
    const endAt = Date.now() + (timerLeft ?? 0) * 1000
    setTimerEndAt(endAt)
    setTimerRunning(true)
  }
  const timerReset = () => {
    clearInterval(timerRef.current)
    setTimerEndAt(null)
    setTimerLeft(null)
    setTimerRunning(false)
    setTimerCompleted(false)
    setTimerClaimed(false)
    setTimerPartial(false)
  }
  const timerClaim = () => { if (!timerClaimed) { setPoints(p => p + timerSelected.pts); setTimerClaimed(true); setTimerPartial(false) } }
  const timerEndEarly = () => {
    clearInterval(timerRef.current)
    setTimerEndAt(null)
    setTimerLeft(null)
    setTimerRunning(false)
    setTimerCompleted(true)
    setTimerClaimed(true)
    setTimerPartial(true)
    setPoints(p => p + 1)
  }

  const timerIsIdle   = timerLeft === null
  const timerDisplay  = timerLeft ?? timerSelected.seconds
  const timerMins     = String(Math.floor(timerDisplay / 60)).padStart(2, '0')
  const timerSecs     = String(timerDisplay % 60).padStart(2, '0')
  const nextBestTask  = tasks.find(t => !t.done) || null

  function exportData() {
    const keys = ['ff_points','ff_tasks','ff_tinyDone','ff_mainGoal','ff_tinyText','ff_habits','ff_rewards','ff_goals','ff_timer','ff_feedbackOn','ff_focusTask','ff_setupComplete','ff_dayKey','ff_moveTasksToTomorrow']
    const data = {}
    keys.forEach(k => { try { const v = localStorage.getItem(k); if (v !== null) data[k] = JSON.parse(v) } catch {} })
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a'); a.href = url; a.download = `focusforge-${new Date().toISOString().slice(0,10)}.json`; a.click()
    URL.revokeObjectURL(url)
  }
  function importData(file) {
    if (!file) return
    const reader = new FileReader()
    reader.onload = e => {
      try {
        const data = JSON.parse(e.target.result)
        Object.keys(data).forEach(k => { if (k.startsWith('ff_')) localStorage.setItem(k, JSON.stringify(data[k])) })
        window.location.reload()
      } catch { alert('Invalid backup file.') }
    }
    reader.readAsText(file)
  }

  const doneTasks = tasks.filter(t => t.done).length
  const showSetup = tab === 'today' && (!setupComplete || setupOpen)

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', maxWidth: 480, margin: '0 auto', minHeight: '100vh', minHeight: '100dvh', background: `radial-gradient(circle at 50% -10%, ${C.blueLight} 0%, transparent 34%), ${C.bg}` }}>
      <div style={{ background: 'rgba(13,15,20,0.94)', borderBottom: `1px solid ${C.border}`, padding: '26px 22px 18px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 10px 28px rgba(0,0,0,0.22)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, color: C.textPri, letterSpacing: -1.2, lineHeight: 1 }}><span>Focus</span><span style={{ color: '#fb7b53' }}>Forge</span></h1>
          {(timerRunning || (timerCompleted && !timerClaimed)) && (
            <button onClick={() => setTab('focus')} style={{ background: timerCompleted ? C.greenLight : C.blueLight, border: `1px solid ${timerCompleted ? C.green : C.blue}`, borderRadius: 24, padding: '5px 12px', fontWeight: 700, fontSize: 12, color: timerCompleted ? C.green : C.blue, cursor: 'pointer', letterSpacing: 0.2, flexShrink: 0 }}>
              {timerCompleted ? '✅ Claim session' : `⏱ ${timerMins}:${timerSecs}`}
            </button>
          )}
          <div style={{ background: 'rgba(255,255,255,0.045)', border: `1px solid ${C.border}`, borderRadius: 24, padding: '9px 14px', fontWeight: 850, fontSize: 16, color: '#fb7b53', letterSpacing: 0.2, boxShadow: '0 8px 18px rgba(0,0,0,0.22)' }}>🔥 {points}</div>
        </div>
      </div>

      <div style={{ padding: '20px 16px 112px' }}>
        {showSetup && <SetupScreen tasks={tasks} onBuild={buildFocusPlan} />}

        {tab === 'today' && !showSetup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {nextBestTask && (
              <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(251,191,36,0.07) 48%, rgba(34,197,94,0.10) 100%)', border: `1px solid rgba(249,115,22,0.30)`, borderRadius: 28, padding: '22px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 44px rgba(249,115,22,0.18)' }}>
                <div>
                  <Label tone="orange">Start Here</Label>
                  <div style={{ fontSize: 22, fontWeight: 850, color: C.textPri, lineHeight: 1.28, letterSpacing: -0.2 }}>{nextBestTask.text}</div>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                  {['10 min','15 min','20 min','25 min'].map(label => <button key={label} onClick={() => startFocus(nextBestTask, label)} style={{ background: 'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)', color: '#1a1208', border: 'none', borderRadius: 999, padding: '12px 6px', minHeight: 46, fontWeight: 850, fontSize: 13, cursor: 'pointer', boxShadow: '0 12px 24px rgba(249,115,22,0.18)' }}>{label}</button>)}
                </div>
              </div>
            )}

            {!nextBestTask && (
              <div style={{ background: 'linear-gradient(135deg,#1a2030 0%,#0f1520 100%)', border: `1px solid rgba(249,115,22,0.25)`, borderRadius: 28, padding: '20px', boxShadow: '0 18px 40px rgba(0,0,0,0.20)' }}>
                <div style={{ fontSize: 12, fontWeight: 850, color: C.orange, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 }}>All tasks done</div>
                <div style={{ fontSize: 15, color: C.textSec, marginBottom: 14, lineHeight: 1.5 }}>Great work. Start a focus session or set a new side quest.</div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setTab('focus')} style={{ ...PrimaryBtn, flex: 1, padding: '12px' }}>Focus</button>
                  <button onClick={() => setTinyDone(false)} style={{ ...GhostBtn, flex: 1, padding: '12px' }}>New Start</button>
                </div>
              </div>
            )}

            <div style={{ background: 'rgba(255,255,255,0.035)', border: `1px solid ${C.border}`, borderRadius: 22, padding: '16px', boxShadow: '0 12px 28px rgba(0,0,0,0.12)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}><div><Label tone="orange">Side Quest</Label><div style={{ color: C.textMut, fontSize: 12, fontWeight: 800, marginTop: -8 }}>Easy Win</div></div>{tinyDone && <Badge color={C.green}>+2 pts</Badge>}</div>
              {tinyDone ? <div style={{ color: C.textPri, fontSize: 17, fontWeight: 800 }}>Side Quest logged</div> : <div style={{ color: C.textPri, fontSize: 18, fontWeight: 800, lineHeight: 1.35 }}>{tinyText}</div>}
              {!tinyDone && <button onClick={() => startFocus({ text: tinyText }, '10 min')} style={{ background: 'linear-gradient(135deg,#fbbf24 0%,#f97316 100%)', color: '#1a1208', border: 'none', borderRadius: 999, padding: '12px 16px', minHeight: 46, marginTop: 12, minWidth: 188, fontWeight: 850, fontSize: 13, cursor: 'pointer', boxShadow: '0 12px 24px rgba(249,115,22,0.18)' }}>Start Side Quest (10 min)</button>}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '10px 0 2px' }}>
              <div style={{ height: 1, background: C.border, flex: 1 }} />
              <div style={{ color: C.textMut, fontSize: 12, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1.1, whiteSpace: 'nowrap' }}>Progress & Options</div>
              <div style={{ height: 1, background: C.border, flex: 1 }} />
            </div>

            <button onClick={() => startFocus(null, '30 min')} style={{ ...PrimaryBtn, padding: '22px 24px', fontSize: 16, borderRadius: 26, background: `linear-gradient(135deg, ${C.orange} 0%, #ef5f46 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 20px 42px rgba(249,115,22,0.30)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 16, textAlign: 'left' }}><span style={{ width: 54, height: 54, borderRadius: '50%', background: 'rgba(255,255,255,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>◎</span><span><span style={{ display: 'block', fontSize: 20, fontWeight: 850 }}>Start Blank 30-Min Sprint</span><span style={{ display: 'block', fontSize: 14, opacity: 0.86, fontWeight: 600, marginTop: 4 }}>30 min · Distraction-free</span></span></span>
              <span style={{ width: 58, height: 58, borderRadius: '50%', background: 'rgba(13,15,20,0.82)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, color: '#fbbf24', flexShrink: 0 }}>▶</span>
            </button>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <Label tone="orange">☷ Top 3 Tasks</Label>
                <span style={{ color: C.orange, fontSize: 12, fontWeight: 800 }}>↕ Reorder</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0, overflow: 'hidden', borderRadius: 18, border: `1px solid ${C.border}` }}>
                {tasks.slice(0, 3).map((task, i) => <TaskRow key={task.id} task={task} index={i} onToggle={() => toggleTask(task.id)} onTextChange={text => updateTaskText(task.id, text)} onFocus={() => { setFocusTask({ id: task.id, text: task.text }); setTab('focus') }} variant="numbered" />)}
              </div>
            </Card>

            <Card>
              <Label tone="green">Main Goal</Label>
              <EditableText value={mainGoal} onChange={setMainGoal} placeholder="What's the one thing that matters today?" multiline size="large" />
            </Card>

            {restarted && !restartOpen && <div style={{ background: C.greenLight, border: `1px solid rgba(34,197,94,0.25)`, borderRadius: 18, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}><div style={{ fontWeight: 750, fontSize: 14, color: C.green }}>Today is still usable.</div><div style={{ fontSize: 12, color: C.textSec }}>{moveTasksToTomorrow ? 'Tasks will carry into tomorrow.' : 'Your day controls are updated.'}</div></div>}

            {restartOpen ? <RestartPanel onStartNewDay={startNewDay} onRebuildToday={rebuildToday} onMoveTasks={moveTasksForward} onCancel={() => setRestartOpen(false)} /> : <button onClick={() => { setRestartOpen(true); setRestarted(false) }} style={{ ...GhostBtn, padding: '18px 20px', borderRadius: 26, display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left', background: 'rgba(255,255,255,0.035)', boxShadow: '0 16px 34px rgba(0,0,0,0.16)' }}><span style={{ display: 'flex', alignItems: 'center', gap: 16 }}><span style={{ width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 27 }}>↻</span><span><span style={{ display: 'block', color: C.textPri, fontSize: 18, fontWeight: 850 }}>Restart My Day</span><span style={{ display: 'block', color: C.textMut, fontSize: 14, marginTop: 3, fontWeight: 500 }}>Reset today's focus without losing rewards or habits.</span></span></span><span style={{ color: C.textMut, fontSize: 28 }}>›</span></button>}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ color: C.textMut, fontSize: 12, fontWeight: 850, textTransform: 'uppercase', letterSpacing: 1.1, paddingLeft: 2 }}>Explore More</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                <button onClick={() => setTab('goals')} style={{ ...GhostBtn, minHeight: 50, padding: '12px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.035)', color: C.textPri }}>🎯 Goals</button>
                <button onClick={() => setTab('habits')} style={{ ...GhostBtn, minHeight: 50, padding: '12px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.035)', color: C.textPri }}>🌿 Habits</button>
                <button onClick={() => setTab('rewards')} style={{ ...GhostBtn, minHeight: 50, padding: '12px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.035)', color: C.textPri }}>🎁 Rewards</button>
              </div>
            </div>

            <details style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 24, overflow: 'hidden', boxShadow: '0 14px 34px rgba(0,0,0,0.14)' }}>
              <summary style={{ listStyle: 'none', padding: '15px 18px', color: C.textSec, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, cursor: 'pointer' }}>More options</summary>
              <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: C.cardAlt, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: C.textSec, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Today's Points</div>
                    <div style={{ color: C.textMut, fontSize: 12, marginTop: 3 }}>{doneTasks}/{tasks.length} tasks done</div>
                  </div>
                  <div style={{ color: C.textPri, fontSize: 30, fontWeight: 800 }}>{points}</div>
                </div>
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Settings</div>
                  <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                    <button onClick={exportData} style={{ ...GhostBtn, flex: 1, padding: '11px', fontSize: 13 }}>Export Data</button>
                    <button onClick={() => importRef.current?.click()} style={{ ...GhostBtn, flex: 1, padding: '11px', fontSize: 13 }}>Import Data</button>
                  </div>
                  <input ref={importRef} type="file" accept=".json" style={{ display: 'none' }} onChange={e => { importData(e.target.files?.[0]); e.target.value = '' }} />
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.red, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Danger Zone</div>
                  <button onClick={resetAllData} style={{ ...GhostBtn, padding: '11px', color: C.red, borderColor: 'rgba(239,68,68,0.3)', width: '100%' }}>Reset all data</button>
                </div>
              </div>
            </details>
          </div>
        )}

        {tab === 'focus' && <FocusTimer
          selected={timerSelected} setSelected={setTimerSelected}
          timeLeft={timerLeft} running={timerRunning}
          completed={timerCompleted} claimed={timerClaimed}
          partial={timerPartial}
          feedbackOn={feedbackOn} setFeedbackOn={setFeedbackOn}
          onStart={timerStart} onPause={timerPause} onResume={timerResume}
          onReset={timerReset} onClaim={timerClaim} onEndEarly={timerEndEarly}
          focusTask={focusTask} onClearFocusTask={() => setFocusTask(null)}
          onRestartDay={() => { setTab('today'); setRestartOpen(true) }}
        />}
        {tab === 'goals' && <GoalsTab goals={goals} setGoals={setGoals} />}
        {tab === 'habits' && <HabitsTab habits={habits} setHabits={setHabits} onPoints={p => setPoints(prev => Math.max(0, prev + p))} />}
        {tab === 'rewards' && (
          <RewardsTab
            points={points}
            rewards={rewards}
            setRewards={setRewards}
            onClaim={cost => setPoints(p => p - cost)}
          />
        )}
      </div>
      <div style={{ padding: '22px 16px 118px', textAlign: 'center', borderTop: `1px solid ${C.border}`, marginTop: 10 }}>
        <p style={{ fontSize: 11, color: C.textMut, margin: 0, lineHeight: 1.6 }}>FocusForge is a productivity support tool, not medical treatment or clinical advice.</p>
      </div>
      <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20, background: 'linear-gradient(180deg, rgba(22,27,38,0.96), rgba(13,15,20,0.99))', borderTop: `1px solid ${C.border}`, boxShadow: '0 -18px 44px rgba(0,0,0,0.54)', padding: '10px 12px calc(10px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr 74px 1fr 1fr', alignItems: 'end', gap: 4 }}>
          <button onClick={() => setTab('today')} style={{ background: tab === 'today' ? C.orangeLight : 'transparent', color: tab === 'today' ? '#fbbf24' : C.textSec, border: '1px solid transparent', borderRadius: 18, padding: '8px 4px', minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: tab === 'today' ? 850 : 650, fontSize: 11, cursor: 'pointer' }}><span style={{ fontSize: 22, lineHeight: 1 }}>☀️</span><span>Today</span></button>
          <button onClick={() => setTab('goals')} style={{ background: tab === 'goals' ? C.blueLight : 'transparent', color: tab === 'goals' ? C.blue : C.textSec, border: '1px solid transparent', borderRadius: 18, padding: '8px 4px', minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: tab === 'goals' ? 850 : 650, fontSize: 11, cursor: 'pointer' }}><span style={{ fontSize: 22, lineHeight: 1 }}>🎯</span><span>Goals</span></button>
          <button onClick={() => setTab('focus')} aria-label="Start focus" style={{ width: 62, height: 62, justifySelf: 'center', marginTop: -24, borderRadius: '50%', background: `linear-gradient(135deg, ${C.orange} 0%, #ef6b4a 100%)`, color: '#fff', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 12px 28px rgba(249,115,22,0.34)', fontSize: 36, lineHeight: 1, cursor: 'pointer' }}>+</button>
          <button onClick={() => setTab('habits')} style={{ background: tab === 'habits' ? C.greenLight : 'transparent', color: tab === 'habits' ? C.green : C.textSec, border: '1px solid transparent', borderRadius: 18, padding: '8px 4px', minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: tab === 'habits' ? 850 : 650, fontSize: 11, cursor: 'pointer' }}><span style={{ fontSize: 22, lineHeight: 1 }}>🌿</span><span>Habits</span></button>
          <button onClick={() => setTab('rewards')} style={{ background: tab === 'rewards' ? C.orangeLight : 'transparent', color: tab === 'rewards' ? C.orange : C.textSec, border: '1px solid transparent', borderRadius: 18, padding: '8px 4px', minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: tab === 'rewards' ? 850 : 650, fontSize: 11, cursor: 'pointer' }}><span style={{ fontSize: 22, lineHeight: 1 }}>🎁</span><span>Rewards</span></button>
        </div>
      </nav>
    </div>
  )
}

function RestartPanel({ onStartNewDay, onRebuildToday, onMoveTasks, onCancel }) {
  const actions = [
    { label: 'Start New Day', tip: 'Clear done states and keep this task list.', onClick: onStartNewDay },
    { label: 'Rebuild Today', tip: 'Create a fresh task list in setup.', onClick: onRebuildToday },
    { label: 'Move Tasks to Tomorrow', tip: 'Carry this task list forward once.', onClick: onMoveTasks },
  ]
  return <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
    <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}` }}><div style={{ fontWeight: 800, fontSize: 16, color: C.textPri }}>Restart My Day</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 4 }}>Reset today's focus without losing rewards or habits.</div></div>
    {actions.map((action, i) => <button key={action.label} onClick={action.onClick} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: i < actions.length - 1 ? `1px solid ${C.border}` : 'none', padding: '14px 18px', cursor: 'pointer', textAlign: 'left' }}><span style={{ display: 'block', fontSize: 14, fontWeight: 800, color: C.textPri }}>{action.label}</span><span style={{ display: 'block', fontSize: 12, color: C.textSec, marginTop: 3 }}>{action.tip}</span></button>)}
    <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.border}` }}><button onClick={onCancel} style={{ width: '100%', background: 'transparent', border: 'none', color: C.textMut, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px' }}>Cancel</button></div>
  </div>
}

function EditableText({ value, onChange, placeholder, multiline, disabled, size }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef()
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  const isHero = size === 'hero'
  const isLarge = size === 'large'
  const textStyle = { fontSize: isHero ? 28 : isLarge ? 21 : 15, fontWeight: isHero ? 850 : isLarge ? 750 : 500, lineHeight: isHero ? 1.25 : isLarge ? 1.35 : 1.6 }
  if (!editing) return <div onClick={() => !disabled && setEditing(true)} style={{ ...textStyle, color: disabled ? C.textMut : C.textPri, cursor: disabled ? 'default' : 'text', padding: isHero ? '4px 0' : '13px 14px', borderRadius: 16, background: isHero || disabled ? 'transparent' : C.cardAlt, border: `1px solid ${isHero || disabled ? 'transparent' : C.border}`, minHeight: isHero ? 72 : 48, display: 'flex', alignItems: 'center' }}>{value || <span style={{ color: C.textMut }}>{placeholder}</span>}{!disabled && !isHero && <span style={{ marginLeft: 'auto', paddingLeft: 8, color: C.textMut, fontSize: 13 }}>Edit</span>}</div>
  const inputStyle = { width: '100%', ...textStyle, color: C.textPri, padding: isHero ? '8px 10px' : '13px 14px', borderRadius: 16, border: `1.5px solid ${C.blue}`, background: C.cardAlt, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }
  return multiline ? <textarea ref={ref} value={value} rows={2} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} style={inputStyle} /> : <input ref={ref} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} style={inputStyle} />
}

function TaskRow({ task, index, onToggle, onTextChange, onFocus, variant }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef()
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  const numbered = variant === 'numbered'
  return <div style={{ display: 'flex', alignItems: 'center', gap: 12, background: task.done ? 'rgba(34,197,94,0.08)' : numbered ? 'rgba(255,255,255,0.015)' : C.cardAlt, border: numbered ? 'none' : `1px solid ${task.done ? 'rgba(34,197,94,0.2)' : C.border}`, borderBottom: numbered && index < 2 ? `1px solid ${C.border}` : numbered ? 'none' : undefined, borderRadius: numbered ? 0 : 18, padding: numbered ? '14px 16px' : '14px 15px', minHeight: 58 }}>
    {numbered ? <button onClick={onToggle} style={{ width: 34, height: 34, borderRadius: '50%', border: 'none', background: task.done ? C.green : '#fb7b53', color: '#111318', fontWeight: 850, fontSize: 14, cursor: 'pointer', flexShrink: 0 }}>{index + 1}</button> : <input type="checkbox" checked={task.done} onChange={onToggle} style={{ width: 18, height: 18, accentColor: C.green, cursor: 'pointer', flexShrink: 0 }} />}
    {editing ? <input ref={ref} value={task.text} onChange={e => onTextChange(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={e => e.key === 'Enter' && setEditing(false)} style={{ flex: 1, fontSize: 15, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', color: C.textPri }} /> : <span onClick={() => !task.done && setEditing(true)} style={{ flex: 1, fontSize: 15, lineHeight: 1.35, color: task.done ? C.textMut : C.textPri, textDecoration: task.done ? 'line-through' : 'none', cursor: task.done ? 'default' : 'text' }}>{task.text || <span style={{ color: C.textMut }}>Task {index + 1}</span>}</span>}
    {!task.done && <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>+3</span>
      <button onClick={e => { e.stopPropagation(); onFocus() }} style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 10, padding: '6px 9px', fontSize: 11, fontWeight: 800, color: C.blue, cursor: 'pointer' }}>Focus</button>
    </div>}
  </div>
}

function RewardsTab({ points, rewards, setRewards, onClaim }) {
  const [flash, setFlash] = useState(null)
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', emoji: '🎁', cost: 3 })
  const [formError, setFormError] = useState(null)
  const nameRef = useRef()
  useEffect(() => { if ((adding || editingId) && nameRef.current) nameRef.current.focus() }, [adding, editingId])

  function claim(reward) {
    if (points >= reward.cost) { onClaim(reward.cost); setFlash({ id: reward.id, type: 'claimed' }) }
    else { setFlash({ id: reward.id, type: 'short' }) }
    setTimeout(() => setFlash(null), 2500)
  }

  function startAdd() {
    setEditingId(null)
    setForm({ name: '', emoji: '🎁', cost: 3 })
    setAdding(true)
  }

  function startEdit(reward) {
    setAdding(false)
    setEditingId(reward.id)
    setForm({ name: reward.name, emoji: reward.emoji, cost: reward.cost })
  }

  function cancelForm() { setAdding(false); setEditingId(null); setFormError(null) }

  function saveAdd() {
    const name = form.name.trim()
    if (!name) { setFormError('Reward name is required.'); return }
    if (Number(form.cost) < 1) { setFormError('Point cost must be at least 1.'); return }
    setFormError(null)
    setRewards(prev => [...prev, { id: Date.now(), name, emoji: form.emoji || '🎁', cost: Math.max(1, Number(form.cost) || 3) }])
    setAdding(false)
  }

  function saveEdit() {
    const name = form.name.trim()
    if (!name) { setFormError('Reward name is required.'); return }
    if (Number(form.cost) < 1) { setFormError('Point cost must be at least 1.'); return }
    setFormError(null)
    setRewards(prev => prev.map(r => r.id === editingId ? { ...r, name, emoji: form.emoji || '🎁', cost: Math.max(1, Number(form.cost) || 3) } : r))
    setEditingId(null)
  }

  function deleteReward(id) { setRewards(prev => prev.filter(r => r.id !== id)) }

  const formCard = (onSave) => (
    <div style={{ background: C.card, borderRadius: 20, padding: '16px 18px', border: `1.5px solid ${C.blue}` }}>
      <Label>{editingId ? '✏️ Edit Reward' : '✨ New Reward'}</Label>
      <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
        <input
          value={form.emoji}
          onChange={e => setForm(f => ({ ...f, emoji: e.target.value }))}
          style={{ width: 58, fontSize: 22, textAlign: 'center', padding: '10px 6px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.cardAlt, color: C.textPri, outline: 'none', fontFamily: 'inherit' }}
        />
        <input
          ref={nameRef}
          value={form.name}
          onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
          onKeyDown={e => { if (e.key === 'Enter') onSave(); if (e.key === 'Escape') cancelForm() }}
          placeholder="Reward name, like Harley ride or 20 min YouTube"
          style={{ flex: 1, fontSize: 14, padding: '10px 13px', borderRadius: 12, border: `1px solid ${C.border}`, background: C.cardAlt, color: C.textPri, outline: 'none', fontFamily: 'inherit' }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
        <span style={{ fontSize: 13, color: C.textSec, fontWeight: 600 }}>Point cost:</span>
        <input
          type="number"
          min="1"
          value={form.cost}
          onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
          style={{ width: 72, fontSize: 14, padding: '8px 10px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.cardAlt, color: C.textPri, outline: 'none', fontFamily: 'inherit' }}
        />
        <span style={{ fontSize: 13, color: C.textMut }}>pts</span>
      </div>
      {formError && <div style={{ fontSize: 12, color: C.red, marginBottom: 10, padding: '8px 10px', background: C.redLight, borderRadius: 8 }}>{formError}</div>}
      <div style={{ display: 'flex', gap: 8 }}>
        <button onClick={onSave} style={{ ...PrimaryBtn, flex: 1 }}>Save</button>
        <button onClick={cancelForm} style={{ ...GhostBtn, flex: 1 }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ background: `linear-gradient(135deg,#1a2030 0%,#0f1520 100%)`, border: `1px solid ${C.border}`, borderRadius: 20, padding: '20px 22px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ color: C.textSec, fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1.2 }}>Available points</div>
          <div style={{ color: C.textPri, fontSize: 44, fontWeight: 800, lineHeight: 1.1, marginTop: 2 }}>{points}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 44 }}>🏅</div>
          {!adding && !editingId && (
            <button onClick={startAdd} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '9px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add</button>
          )}
        </div>
      </div>

      {adding && formCard(saveAdd)}

      {rewards.length === 0 && !adding && (
        <div style={{ background: C.card, borderRadius: 20, padding: '32px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🎁</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, marginBottom: 6 }}>No rewards yet</div>
          <div style={{ fontSize: 13, color: C.textSec }}>Add something that actually motivates you.</div>
        </div>
      )}

      {rewards.map(reward => {
        const canAfford = points >= reward.cost
        const isClaimed = flash?.id === reward.id && flash.type === 'claimed'
        const isShort = flash?.id === reward.id && flash.type === 'short'
        if (editingId === reward.id) return <div key={reward.id}>{formCard(saveEdit)}</div>
        return (
          <div key={reward.id} style={{ background: C.card, borderRadius: 20, overflow: 'hidden', border: isClaimed ? `1.5px solid rgba(34,197,94,0.4)` : isShort ? `1.5px solid rgba(239,68,68,0.4)` : `1px solid ${C.border}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, fontSize: 26, background: canAfford ? C.greenLight : C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{reward.emoji}</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.textPri }}>{reward.name}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                  <span style={{ background: canAfford ? C.greenLight : C.cardAlt, color: canAfford ? C.green : C.textMut, borderRadius: 20, padding: '2px 10px', fontSize: 12, fontWeight: 700 }}>{reward.cost} pts</span>
                  {!canAfford && <span style={{ fontSize: 11, color: C.textMut }}>{reward.cost - points} more needed</span>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                <button onClick={() => claim(reward)} style={{ background: canAfford ? C.blue : C.cardAlt, color: canAfford ? '#fff' : C.textMut, border: 'none', borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Claim</button>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button onClick={() => startEdit(reward)} style={{ flex: 1, background: C.cardAlt, color: C.textSec, border: `1px solid ${C.border}`, borderRadius: 10, padding: '6px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteReward(reward.id)} style={{ flex: 1, background: 'rgba(239,68,68,0.1)', color: C.red, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 10, padding: '6px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
            </div>
            {(isClaimed || isShort) && (
              <div style={{ padding: '11px 18px', background: isClaimed ? C.greenLight : C.redLight, borderTop: `1px solid ${isClaimed ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 16 }}>{isClaimed ? '🎉' : '💪'}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: isClaimed ? C.green : C.red }}>{isClaimed ? `Reward claimed! Enjoy your ${reward.name}.` : 'Earn one more tiny win first.'}</span>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

const BREAKDOWN_STEPS = [
  'Write down exactly what done looks like.',
  'Identify the very first physical action.',
  'Remove one obstacle before you start.',
  'Set a timer for 10 minutes and just begin.',
  'After 10 minutes, decide whether to keep going.',
]

function GoalsTab({ goals, setGoals }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [expandedId, setExpandedId] = useState(null)
  const [form, setForm] = useState({ name: '', why: '', tinyStep: '', minWin: '', backup: '' })
  const [nameError, setNameError] = useState(false)
  const nameRef = useRef()
  useEffect(() => { if ((adding || editingId) && nameRef.current) nameRef.current.focus() }, [adding, editingId])

  function blankForm() { return { name: '', why: '', tinyStep: '', minWin: '', backup: '' } }

  function startAdd() { setEditingId(null); setForm(blankForm()); setAdding(true) }

  function startEdit(goal) {
    setAdding(false)
    setEditingId(goal.id)
    setForm({ name: goal.name, why: goal.why || '', tinyStep: goal.tinyStep || '', minWin: goal.minWin || '', backup: goal.backup || '' })
  }

  function cancelForm() { setAdding(false); setEditingId(null); setNameError(false) }

  function saveAdd() {
    const name = form.name.trim()
    if (!name) { setNameError(true); return }
    setNameError(false)
    setGoals(prev => [...prev, { id: Date.now(), name, why: form.why, tinyStep: form.tinyStep, minWin: form.minWin, backup: form.backup, breakdown: false }])
    setAdding(false)
  }

  function saveEdit() {
    const name = form.name.trim()
    if (!name) { setNameError(true); return }
    setNameError(false)
    setGoals(prev => prev.map(g => g.id === editingId ? { ...g, name, why: form.why, tinyStep: form.tinyStep, minWin: form.minWin, backup: form.backup } : g))
    setEditingId(null)
  }

  function deleteGoal(id) { setGoals(prev => prev.filter(g => g.id !== id)); if (expandedId === id) setExpandedId(null) }

  function toggleBreakdown(id) { setExpandedId(v => v === id ? null : id) }

  const Field = ({ label, value, field, placeholder, multiline }) => (
    <div style={{ marginBottom: 10 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>{label}</div>
      {multiline
        ? <textarea value={value} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} rows={2} style={{ width: '100%', fontSize: 13, padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.cardAlt, color: C.textPri, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }} />
        : <input value={value} onChange={e => setForm(f => ({ ...f, [field]: e.target.value }))} placeholder={placeholder} style={{ width: '100%', fontSize: 13, padding: '9px 12px', borderRadius: 10, border: `1px solid ${C.border}`, background: C.cardAlt, color: C.textPri, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
      }
    </div>
  )

  const GoalForm = ({ onSave }) => (
    <div style={{ background: C.card, borderRadius: 20, padding: '16px 18px', border: `1.5px solid ${C.blue}` }}>
      <Label>{editingId ? '✏️ Edit Goal' : '🎯 New Goal'}</Label>
      <div style={{ marginBottom: 10 }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: 0.7, marginBottom: 4 }}>Goal name</div>
        <input ref={nameRef} value={form.name} onChange={e => { setForm(f => ({ ...f, name: e.target.value })); if (nameError) setNameError(false) }} onKeyDown={e => e.key === 'Escape' && cancelForm()} placeholder="e.g. Launch my side project" style={{ width: '100%', fontSize: 14, padding: '10px 13px', borderRadius: 12, border: `1.5px solid ${nameError ? C.red : C.blue}`, background: C.cardAlt, color: C.textPri, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }} />
        {nameError && <div style={{ fontSize: 12, color: C.red, marginTop: 5 }}>Goal name is required.</div>}
      </div>
      <Field label="Why it matters" field="why" value={form.why} placeholder="What changes if you achieve this?" multiline />
      <Field label="Tiny next step" field="tinyStep" value={form.tinyStep} placeholder="The smallest possible action right now" />
      <Field label="Minimum win" field="minWin" value={form.minWin} placeholder="What counts as good enough today?" />
      <Field label="Backup plan" field="backup" value={form.backup} placeholder="If things go wrong, I will..." />
      <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
        <button onClick={onSave} style={{ ...PrimaryBtn, flex: 1 }}>Save goal</button>
        <button onClick={cancelForm} style={{ ...GhostBtn, flex: 1 }}>Cancel</button>
      </div>
    </div>
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 17, color: C.textPri }}>🏆 Goals</div>
        {!adding && !editingId && <button onClick={startAdd} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add goal</button>}
      </div>

      {adding && <GoalForm onSave={saveAdd} />}

      {goals.length === 0 && !adding && (
        <div style={{ background: C.card, borderRadius: 20, padding: '32px 20px', border: `1px solid ${C.border}`, textAlign: 'center' }}>
          <div style={{ fontSize: 38, marginBottom: 10 }}>🎯</div>
          <div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, marginBottom: 6 }}>No goals yet</div>
          <div style={{ fontSize: 13, color: C.textSec }}>Add a goal to break it down and make it real.</div>
        </div>
      )}

      {goals.map(goal => {
        if (editingId === goal.id) return <div key={goal.id}><GoalForm onSave={saveEdit} /></div>
        const isExpanded = expandedId === goal.id
        return (
          <div key={goal.id} style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: goal.why || goal.tinyStep || goal.minWin || goal.backup ? 10 : 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.textPri, flex: 1, paddingRight: 10 }}>{goal.name}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(goal)} style={{ background: C.cardAlt, color: C.textSec, border: `1px solid ${C.border}`, borderRadius: 9, padding: '5px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteGoal(goal.id)} style={{ background: 'rgba(239,68,68,0.1)', color: C.red, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 9, padding: '5px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              {goal.why && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Why: </span>{goal.why}</div>}
              {goal.tinyStep && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Next step: </span>{goal.tinyStep}</div>}
              {goal.minWin && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Min win: </span>{goal.minWin}</div>}
              {goal.backup && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Backup: </span>{goal.backup}</div>}
              <button onClick={() => toggleBreakdown(goal.id)} style={{ marginTop: 8, background: isExpanded ? C.blueLight : C.cardAlt, color: isExpanded ? C.blue : C.textSec, border: `1px solid ${isExpanded ? C.blue : C.border}`, borderRadius: 10, padding: '7px 14px', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {isExpanded ? '▲ Hide breakdown' : '🧩 Break It Down'}
              </button>
            </div>
            {isExpanded && (
              <div style={{ borderTop: `1px solid ${C.border}`, padding: '14px 18px', background: C.cardAlt }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: C.textMut, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>Action steps</div>
                {BREAKDOWN_STEPS.map((step, i) => (
                  <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, alignItems: 'flex-start' }}>
                    <div style={{ width: 22, height: 22, borderRadius: '50%', background: C.blueLight, color: C.blue, fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>{i + 1}</div>
                    <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>{step}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

function HabitsTab({ habits, setHabits, onPoints }) {
  const [newName, setNewName] = useState('')
  const [adding, setAdding] = useState(false)
  const [nameError, setNameError] = useState(false)
  const inputRef = useRef()
  useEffect(() => { if (adding && inputRef.current) inputRef.current.focus() }, [adding])
  function addHabit() { const name = newName.trim(); if (!name) { setNameError(true); return } setNameError(false); setHabits(prev => [...prev, { id: Date.now(), name, streak: 0, todayStatus: null, skipMsg: null }]); setNewName(''); setAdding(false) }
  function markHabit(id, status) { setHabits(prev => prev.map(h => { if (h.id !== id) return h; if (h.todayStatus === status) return h; const wasPartial = h.todayStatus === 'partial'; const wasFull = h.todayStatus === 'full'; if (status === 'full') { if (wasPartial) onPoints(2); else onPoints(3); return { ...h, todayStatus: 'full', streak: h.streak + 1, skipMsg: null } } if (status === 'partial') { if (wasFull) onPoints(-2); else onPoints(1); return { ...h, todayStatus: 'partial', streak: h.streak + 1, skipMsg: null } } if (status === 'skip') { if (wasFull) onPoints(-3); if (wasPartial) onPoints(-1); return { ...h, todayStatus: 'skip', skipMsg: SKIP_MESSAGES[Math.floor(Math.random() * SKIP_MESSAGES.length)] } } return h })) }
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 800, fontSize: 17, color: C.textPri }}>Habits</div>{!adding && <button onClick={() => setAdding(true)} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add habit</button>}</div>
    {adding && <Card><Label>New habit</Label><input ref={inputRef} value={newName} onChange={e => { setNewName(e.target.value); if (nameError) setNameError(false) }} onKeyDown={e => { if (e.key === 'Enter') addHabit(); if (e.key === 'Escape') { setAdding(false); setNameError(false) } }} placeholder="e.g. Drink water, Read, Exercise..." style={{ width: '100%', fontSize: 14, padding: '11px 13px', borderRadius: 12, border: `1.5px solid ${nameError ? C.red : C.blue}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: nameError ? 4 : 10, background: C.cardAlt, color: C.textPri }} />{nameError && <div style={{ fontSize: 12, color: C.red, marginBottom: 8 }}>Habit name is required.</div>}<div style={{ display: 'flex', gap: 8 }}><button onClick={addHabit} style={{ ...PrimaryBtn, flex: 1 }}>Add</button><button onClick={() => { setAdding(false); setNewName(''); setNameError(false) }} style={{ ...GhostBtn, flex: 1 }}>Cancel</button></div></Card>}
    {habits.length === 0 && !adding && <Card><div style={{ textAlign: 'center', padding: '24px 0' }}><div style={{ fontSize: 38, marginBottom: 10 }}>Habit</div><div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, marginBottom: 6 }}>No habits yet</div><div style={{ fontSize: 13, color: C.textSec }}>Add your first habit above to get started.</div></div></Card>}
    {habits.map(habit => <div key={habit.id} style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}><div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontWeight: 700, fontSize: 15, color: C.textPri }}>{habit.name}</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{habit.streak > 0 ? `${habit.streak} day streak` : 'No streak yet - start today'}</div></div><button onClick={() => setHabits(prev => prev.filter(h => h.id !== habit.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, fontSize: 16, padding: 4 }}>x</button></div>{habit.todayStatus === 'skip' && habit.skipMsg && <div style={{ margin: '0 14px 12px', background: C.cardAlt, borderRadius: 12, padding: '10px 13px', fontSize: 13, color: C.textSec, fontStyle: 'italic' }}>{habit.skipMsg}</div>}<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.border}` }}>{[{ status: 'full', label: 'Full win', pts: '+3', activeColor: C.green, activeBg: C.greenLight }, { status: 'partial', label: 'Partial win', pts: '+1', activeColor: C.orange, activeBg: C.orangeLight }, { status: 'skip', label: 'Skip', pts: '', activeColor: C.textSec, activeBg: C.cardAlt }].map((btn, i) => { const active = habit.todayStatus === btn.status; return <button key={btn.status} onClick={() => markHabit(habit.id, btn.status)} style={{ background: active ? btn.activeBg : 'transparent', border: 'none', borderRight: i < 2 ? `1px solid ${C.border}` : 'none', padding: '13px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 12, fontWeight: 700, color: active ? btn.activeColor : C.textSec }}>{btn.label}</span>{btn.pts && <span style={{ fontSize: 11, color: active ? btn.activeColor : C.textMut, fontWeight: 600 }}>{btn.pts} pts</span>}</button> })}</div></div>)}
  </div>
}

function playCompletionSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const notes = [523.25, 659.25, 783.99, 1046.5]
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.type = 'sine'
      osc.frequency.value = freq
      const t = ctx.currentTime + i * 0.18
      gain.gain.setValueAtTime(0, t)
      gain.gain.linearRampToValueAtTime(0.28, t + 0.04)
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.55)
      osc.start(t)
      osc.stop(t + 0.55)
    })
  } catch {}
}

function SetupScreen({ tasks, onBuild }) {
  const initialTexts = Array.isArray(tasks) && hasCustomTasks(tasks) ? tasks.map(t => t.text || '').slice(0, 5) : ['', '', '']
  const [inputs, setInputs] = useState(() => initialTexts.length >= 3 ? initialTexts : ['', '', ''])
  const [mainTask, setMainTask] = useState('')
  const [tinyTask, setTinyTask] = useState('')
  const validTasks = inputs.map(t => t.trim()).filter(Boolean)
  const canBuild = validTasks.length >= 3
  const selectedMain = mainTask && validTasks.includes(mainTask) ? mainTask : validTasks[0] || ''
  const tinyOptions = validTasks.filter(task => task !== selectedMain)
  const selectedTiny = tinyTask && tinyOptions.includes(tinyTask) ? tinyTask : tinyOptions[0] || ''
  useEffect(() => {
    if (canBuild && !validTasks.includes(mainTask)) setMainTask(validTasks[0])
    if (canBuild && !tinyOptions.includes(tinyTask)) setTinyTask(tinyOptions[0] || '')
  }, [canBuild, mainTask, tinyTask, validTasks.join('|')])
  const updateInput = (index, value) => setInputs(prev => prev.map((item, i) => i === index ? value : item))
  const submit = () => { if (canBuild) onBuild(inputs, selectedMain, selectedTiny) }
  const choiceButton = (task, active, onClick) => <button key={task} onClick={onClick} style={{ background: active ? C.orangeLight : 'rgba(255,255,255,0.025)', border: `1.5px solid ${active ? C.orange : C.border}`, borderRadius: 16, padding: '13px 14px', color: active ? C.textPri : C.textSec, fontWeight: active ? 850 : 650, fontSize: 14, textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${active ? C.orange : C.border}`, background: active ? C.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1208', fontSize: 12, fontWeight: 900 }}>{active ? '✓' : ''}</span><span>{task}</span></button>
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ padding: '4px 2px 0' }}>
      <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>Get it out of your head. We'll turn it into a plan.</div>
    </div>
    <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(22,27,38,0.96))', border: `1px solid ${C.border}`, borderRadius: 28, padding: 20, boxShadow: '0 18px 40px rgba(0,0,0,0.20)' }}>
      <div style={{ fontSize: 25, fontWeight: 900, color: C.textPri, letterSpacing: -0.4, marginBottom: 6 }}>Brain dump your tasks</div>
      <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.5, marginBottom: 18 }}>Add at least 3 things. They do not need to be perfect.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {inputs.map((value, i) => <input key={i} value={value} onChange={e => updateInput(i, e.target.value)} placeholder={`Task ${i + 1}`} style={{ width: '100%', minHeight: 54, borderRadius: 16, border: `1.5px solid ${C.border}`, background: C.cardAlt, color: C.textPri, padding: '14px 15px', fontSize: 16, outline: 'none', fontFamily: 'inherit' }} />)}
      </div>
      <button onClick={() => setInputs(prev => [...prev, ''])} style={{ ...GhostBtn, marginTop: 12, padding: '12px 14px', minHeight: 46 }}>+ Add another task</button>
      {canBuild && <div style={{ marginTop: 20 }}>
        <Label tone="green">Pick the one that matters most today</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {validTasks.map(task => choiceButton(task, selectedMain === task, () => setMainTask(task)))}
        </div>
        <div style={{ height: 14 }} />
        <Label tone="orange">Pick a Side Quest</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {tinyOptions.map(task => choiceButton(task, selectedTiny === task, () => setTinyTask(task)))}
        </div>
      </div>}
      <button onClick={submit} disabled={!canBuild} style={{ ...PrimaryBtn, marginTop: 20, background: canBuild ? `linear-gradient(135deg, ${C.orange} 0%, #ef5f46 100%)` : C.cardAlt, color: canBuild ? '#fff' : C.textMut, cursor: canBuild ? 'pointer' : 'not-allowed', boxShadow: canBuild ? '0 18px 34px rgba(249,115,22,0.24)' : 'none' }}>{canBuild ? 'Build My Focus Plan' : 'Add at least 3 tasks'}</button>
    </div>
  </div>
}

function FocusTimer({ selected, setSelected, timeLeft, running, completed, claimed, partial, feedbackOn, setFeedbackOn, onStart, onPause, onResume, onReset, onClaim, onEndEarly, focusTask, onClearFocusTask, onRestartDay }) {
  const [stuckOpen, setStuckOpen] = useState(false)
  const isIdle = timeLeft === null
  const current = timeLeft ?? selected.seconds
  const mins = String(Math.floor(current / 60)).padStart(2, '0')
  const secs = String(current % 60).padStart(2, '0')
  const pct = isIdle ? 0 : 1 - current / selected.seconds
  const R = 88
  const circ = 2 * Math.PI * R
  const dashOffset = circ * (1 - pct)
  const ringColor = completed ? C.green : running ? C.blue : C.orange
  const stuckOptions = [
    { emoji: '✂️', label: 'Make this task smaller', tip: 'What is the single next physical action? Do only that.', action: null },
    { emoji: '⏱', label: 'Switch to 5-minute mode', tip: null, action: () => { setSelected(DURATIONS[0]); setStuckOpen(false) } },
    { emoji: '🧘', label: 'Take a quick reset break', tip: 'Step away 5 min. Breathe, stretch, then come back fresh.', action: null },
    { emoji: '🔄', label: 'Return to Today & Restart My Day', tip: null, action: () => { onRestartDay(); setStuckOpen(false) } },
  ]
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
    {focusTask && <div style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 16, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}><div><div style={{ fontSize: 11, fontWeight: 700, color: C.blue, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 3 }}>Focusing on</div><div style={{ fontSize: 14, fontWeight: 700, color: C.textPri }}>{focusTask.text}</div></div><button onClick={onClearFocusTask} style={{ background: 'none', border: 'none', color: C.textMut, fontSize: 16, cursor: 'pointer', padding: 4, flexShrink: 0 }}>✕</button></div>}
    {isIdle && <Card><Label>⏱ Choose session length</Label><div style={{ display: 'flex', gap: 10 }}>{DURATIONS.map(d => <button key={d.label} onClick={() => setSelected(d)} style={{ flex: 1, background: selected === d ? C.blue : C.cardAlt, color: selected === d ? '#fff' : C.textSec, border: `1px solid ${selected === d ? C.blue : C.border}`, borderRadius: 14, padding: '15px 6px', fontWeight: 700, fontSize: 15, cursor: 'pointer' }}>{d.label}<span style={{ display: 'block', fontSize: 11, marginTop: 3, fontWeight: 500, color: selected === d ? 'rgba(255,255,255,0.7)' : C.textMut }}>+{d.pts} pts</span></button>)}</div><div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, paddingTop: 12, borderTop: `1px solid ${C.border}` }}><div><div style={{ fontSize: 13, fontWeight: 600, color: C.textSec }}>🔔 Sound & haptic feedback</div><div style={{ fontSize: 11, color: C.textMut, marginTop: 2 }}>Plays a chime when your session ends</div></div><button onClick={() => setFeedbackOn(v => !v)} style={{ background: feedbackOn ? C.blue : C.cardAlt, border: `1.5px solid ${feedbackOn ? C.blue : C.border}`, borderRadius: 20, width: 48, height: 26, cursor: 'pointer', position: 'relative', transition: 'background 0.2s, border-color 0.2s', flexShrink: 0 }}><div style={{ position: 'absolute', top: 3, left: feedbackOn ? 24 : 4, width: 16, height: 16, borderRadius: '50%', background: '#fff', transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.4)' }} /></button></div></Card>}
    <div style={{ background: completed ? 'rgba(34,197,94,0.06)' : C.card, border: `1px solid ${completed ? 'rgba(34,197,94,0.2)' : C.border}`, borderRadius: 24, padding: '32px 20px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
      <div style={{ position: 'relative', width: 210, height: 210 }}><svg width="210" height="210" style={{ transform: 'rotate(-90deg)' }}><circle cx="105" cy="105" r={R} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="14" /><circle cx="105" cy="105" r={R} fill="none" stroke={ringColor} strokeWidth="14" strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={isIdle ? circ : dashOffset} style={{ transition: 'stroke-dashoffset 1s linear, stroke 0.3s' }} /></svg><div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>{completed ? <><div style={{ fontSize: 44 }}>✅</div><div style={{ fontSize: 14, fontWeight: 700, color: C.green, marginTop: 6 }}>Done!</div></> : <><div style={{ fontSize: 48, fontWeight: 800, color: C.textPri, letterSpacing: 1, lineHeight: 1 }}>{mins}:{secs}</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 6 }}>{isIdle ? selected.label : running ? 'Stay focused' : 'Paused'}</div></>}</div></div>
      {completed ? (claimed
        ? <div style={{ textAlign: 'center' }}><div style={{ background: C.orange, color: '#fff', borderRadius: 16, padding: '14px 28px', fontWeight: 800, fontSize: 17, letterSpacing: 0.3 }}>{partial ? '⚡ Partial win logged.' : '🔥 Momentum protected'}</div><div style={{ color: C.green, fontWeight: 700, fontSize: 14, marginTop: 10 }}>+{partial ? 1 : selected.pts} pts added!</div><button onClick={onReset} style={{ ...GhostBtn, marginTop: 14 }}>Start another session</button></div>
        : <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}><div style={{ fontSize: 15, fontWeight: 700, color: C.textPri }}>Session complete - claim your reward</div><button onClick={onClaim} style={{ ...PrimaryBtn, background: C.green }}>Claim +{selected.pts} pts</button><button onClick={onReset} style={GhostBtn}>Discard</button></div>)
        : isIdle
          ? <button onClick={onStart} style={{ ...PrimaryBtn, width: 180, padding: '15px' }}>▶ Start</button>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <div style={{ display: 'flex', gap: 12 }}>{running ? <button onClick={onPause} style={{ ...PrimaryBtn, flex: 1 }}>⏸ Pause</button> : <button onClick={onResume} style={{ ...PrimaryBtn, flex: 1 }}>▶ Resume</button>}<button onClick={onReset} style={{ ...GhostBtn, flex: 1 }}>↺ Reset</button></div>
              {running && <button onClick={onEndEarly} style={{ background: 'rgba(249,115,22,0.12)', border: `1px solid rgba(249,115,22,0.3)`, borderRadius: 14, padding: '11px', color: C.orange, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>⚡ End early - partial win (+1 pt)</button>}
            </div>}
    </div>
    {!isIdle && !completed && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 16, padding: '13px 16px', fontSize: 13, color: C.textSec, textAlign: 'center', fontStyle: 'italic' }}>Every minute counts. Keep going. 💪</div>}
    {!isIdle && !completed && <>
      <button onClick={() => setStuckOpen(v => !v)} style={{ background: stuckOpen ? C.cardAlt : 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '12px 20px', color: C.textSec, fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' }}>{stuckOpen ? '▲ Close' : "🤔 I'm stuck"}</button>
      {stuckOpen && <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
        <div style={{ padding: '14px 18px 10px', borderBottom: `1px solid ${C.border}` }}><div style={{ fontWeight: 700, fontSize: 15, color: C.textPri }}>What's getting in the way?</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Pick what fits right now.</div></div>
        {stuckOptions.map((opt, i) => <div key={i} style={{ borderBottom: i < stuckOptions.length - 1 ? `1px solid ${C.border}` : 'none' }}><button onClick={opt.action || undefined} style={{ width: '100%', background: 'transparent', border: 'none', padding: '13px 18px', cursor: opt.action ? 'pointer' : 'default', display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left' }}><span style={{ fontSize: 18, width: 36, height: 36, borderRadius: 10, background: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{opt.emoji}</span><div><div style={{ fontSize: 14, fontWeight: 600, color: C.textPri }}>{opt.label}</div>{opt.tip && <div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{opt.tip}</div>}</div></button></div>)}
      </div>}
    </>}
  </div>
}

function Card({ children, variant }) { return <div style={{ background: variant === 'goal' ? 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(22,27,38,0.96))' : 'rgba(22,27,38,0.96)', borderRadius: 28, padding: variant === 'goal' ? '24px 22px' : '20px', border: `1px solid ${C.border}`, boxShadow: '0 18px 40px rgba(0,0,0,0.20)' }}>{children}</div> }
function Label({ children, tone }) { return <div style={{ fontWeight: 850, fontSize: 12, color: tone === 'orange' ? C.orange : tone === 'green' ? '#9fb58d' : C.textSec, textTransform: 'uppercase', letterSpacing: 1.15, marginBottom: 12 }}>{children}</div> }
function Badge({ children, color }) { return <div style={{ background: color + '22', color, borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 800 }}>{children}</div> }
function Empty({ children }) { return <p style={{ color: C.textMut, fontSize: 14, margin: 0 }}>{children}</p> }

const PrimaryBtn = { background: C.blue, color: '#fff', border: 'none', borderRadius: 18, padding: '15px 20px', minHeight: 50, fontWeight: 800, fontSize: 15, cursor: 'pointer', width: '100%', boxShadow: '0 12px 24px rgba(59,130,246,0.18)' }
const GhostBtn = { background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 20px', minHeight: 48, color: C.textSec, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }

