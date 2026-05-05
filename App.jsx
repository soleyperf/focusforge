import { useState, useEffect, useRef } from 'react'
import { load, save } from './utils/storage.js'
import { C, DEFAULT_GOAL, DEFAULT_TINY, defaultTasks, DURATIONS, DEFAULT_REWARDS, todayKey, hasCustomTasks } from './constants.js'
import { playCompletionSound } from './utils/sound.js'
import { RestartPanel } from './components/RestartPanel.jsx'
import { Card, Label, Badge, EditableText, TaskRow, PrimaryBtn, GhostBtn } from './components/ui.jsx'
import { SetupScreen } from './components/SetupScreen.jsx'
import { FocusTimer } from './components/FocusTimer.jsx'
import { GoalsTab } from './tabs/GoalsTab.jsx'
import { HabitsTab } from './tabs/HabitsTab.jsx'
import { RewardsTab } from './tabs/RewardsTab.jsx'

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
  function buildFocusPlan(taskTexts, mainText, tinyTaskText, goalLink = {}) {
    const clean = taskTexts.map(t => t.trim()).filter(Boolean)
    if (clean.length < 3) return
    const priority = mainText || clean[0]
    const tinyTask = tinyTaskText && tinyTaskText !== priority ? tinyTaskText : (clean.find(t => t !== priority) || clean[1] || priority)
    const ordered = [priority, tinyTask, ...clean.filter((text, i) => i !== clean.indexOf(priority) && i !== clean.indexOf(tinyTask))]
    const linkedGoal = goalLink.quickGoal || null
    const goalId = linkedGoal?.id || goalLink.goalId || null
    const nextTasks = ordered.map((text, i) => ({ id: Date.now() + i, text, done: false, ...(i === 0 && goalId ? { goalId } : {}) }))
    if (linkedGoal) setGoals(prev => [...prev, linkedGoal])
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
        {showSetup && <SetupScreen tasks={tasks} goals={goals} onBuild={buildFocusPlan} />}

        {tab === 'today' && !showSetup && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {nextBestTask && (
              <div style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.16) 0%, rgba(251,191,36,0.07) 48%, rgba(34,197,94,0.10) 100%)', border: `1px solid rgba(249,115,22,0.30)`, borderRadius: 28, padding: '22px', display: 'flex', flexDirection: 'column', gap: 16, boxShadow: '0 20px 44px rgba(249,115,22,0.18)' }}>
                <div>
                  <Label tone="orange">Main Quest</Label>
                  <div style={{ fontSize: 12, color: C.textMut, marginTop: -8, marginBottom: 8, fontWeight: 700 }}>Your main focus today</div>
                  <div style={{ fontSize: 22, fontWeight: 850, color: C.textPri, lineHeight: 1.28, letterSpacing: -0.2 }}>{nextBestTask.text}</div>
                  {nextBestTask.goalId && <div style={{ fontSize: 12, color: C.textMut, marginTop: 8, fontWeight: 700 }}>Supports: {goals.find(g => g.id === nextBestTask.goalId)?.name || 'Goal'}</div>}
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
        {tab === 'goals' && <GoalsTab goals={goals} setGoals={setGoals} tasks={tasks} />}
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
          <button onClick={() => setTab('focus')} aria-label="Focus" style={{ width: 62, height: 62, justifySelf: 'center', marginTop: -24, borderRadius: '50%', background: `linear-gradient(135deg, ${C.orange} 0%, #ef6b4a 100%)`, color: '#fff', border: '1px solid rgba(255,255,255,0.18)', boxShadow: '0 12px 28px rgba(249,115,22,0.34)', fontSize: 20, lineHeight: 1, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: 850 }}><span>▶</span><span style={{ fontSize: 10 }}>Focus</span></button>
          <button onClick={() => setTab('habits')} style={{ background: tab === 'habits' ? C.greenLight : 'transparent', color: tab === 'habits' ? C.green : C.textSec, border: '1px solid transparent', borderRadius: 18, padding: '8px 4px', minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: tab === 'habits' ? 850 : 650, fontSize: 11, cursor: 'pointer' }}><span style={{ fontSize: 22, lineHeight: 1 }}>🌿</span><span>Habits</span></button>
          <button onClick={() => setTab('rewards')} style={{ background: tab === 'rewards' ? C.orangeLight : 'transparent', color: tab === 'rewards' ? C.orange : C.textSec, border: '1px solid transparent', borderRadius: 18, padding: '8px 4px', minHeight: 60, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 5, fontWeight: tab === 'rewards' ? 850 : 650, fontSize: 11, cursor: 'pointer' }}><span style={{ fontSize: 22, lineHeight: 1 }}>🎁</span><span>Rewards</span></button>
        </div>
      </nav>
    </div>
  )
}
