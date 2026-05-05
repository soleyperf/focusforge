import { useState, useEffect, useRef } from 'react'
import { load, save } from './utils/storage.js'
import { C } from './constants/colors.js'
import { DURATIONS } from './constants/durations.js'
import { DEFAULT_GOAL, DEFAULT_TINY, defaultTasks, DEFAULT_REWARDS, hasCustomTasks } from './constants/defaults.js'
import { todayKey } from './utils/date.js'
import { playCompletionSound } from './utils/timerFeedback.js'
import { RestartPanel } from './components/RestartPanel.jsx'
import { Card, Label, Badge, PrimaryBtn, GhostBtn } from './components/Card.jsx'
import { EditableText } from './components/EditableText.jsx'
import { TaskRow } from './components/TaskRow.jsx'
import { SetupScreen } from './components/SetupScreen.jsx'
import { FocusTimer } from './components/FocusTab.jsx'
import { GoalsTab } from './components/GoalsTab.jsx'
import { HabitsTab } from './components/HabitsTab.jsx'
import { RewardsTab } from './components/RewardsTab.jsx'
import { Header } from './components/Header.jsx'
import { BottomNav } from './components/BottomNav.jsx'

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
      <Header
        timerRunning={timerRunning}
        timerCompleted={timerCompleted}
        timerClaimed={timerClaimed}
        timerMins={timerMins}
        timerSecs={timerSecs}
        points={points}
        setTab={setTab}
      />

      <div style={{ padding: '20px 16px 112px' }}>
        {showSetup && <SetupScreen tasks={tasks} goals={goals} onBuild={buildFocusPlan} />}

        {tab === 'today' && !showSetup && (
          <TodayTab
            nextBestTask={nextBestTask}
            goals={goals}
            startFocus={startFocus}
            setTab={setTab}
            setTinyDone={setTinyDone}
            tinyDone={tinyDone}
            tinyText={tinyText}
            tasks={tasks}
            toggleTask={toggleTask}
            updateTaskText={updateTaskText}
            setFocusTask={setFocusTask}
            mainGoal={mainGoal}
            setMainGoal={setMainGoal}
            restarted={restarted}
            restartOpen={restartOpen}
            moveTasksToTomorrow={moveTasksToTomorrow}
            startNewDay={startNewDay}
            rebuildToday={rebuildToday}
            moveTasksForward={moveTasksForward}
            setRestartOpen={setRestartOpen}
            setRestarted={setRestarted}
            doneTasks={doneTasks}
            points={points}
            exportData={exportData}
            importRef={importRef}
            importData={importData}
            resetAllData={resetAllData}
          />
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
      <BottomNav tab={tab} setTab={setTab} />
    </div>
  )
}
