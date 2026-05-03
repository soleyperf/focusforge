import { useState, useEffect, useRef } from 'react'

/* ── Persistence helpers ── */
function load(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v !== null ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)) } catch {}
}

/* ── Design tokens ── */
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
const DEFAULT_TINY   = 'Work for just 5 minutes — no pressure, just begin.'
const defaultTasks   = [
  { id: 1, text: 'Pick one useful task', done: false },
  { id: 2, text: 'Clear one small area', done: false },
  { id: 3, text: 'Do one 10-minute focus sprint', done: false },
]
const DURATIONS = [
  { label: '5 min',  seconds: 5  * 60, pts: 3 },
  { label: '10 min', seconds: 10 * 60, pts: 3 },
  { label: '25 min', seconds: 25 * 60, pts: 5 },
]
const RESTART_OPTIONS = [
  { id: 'five', emoji: '⚡', label: 'Give me a 5-minute task', tiny: "Pick one small thing and work on it for just 5 minutes. That's all." },
  { id: 'shrink', emoji: '🎯', label: "Shrink today's goal", tiny: 'Forget the big plan. One small win is enough for today.' },
  { id: 'focus10', emoji: '⏱', label: 'Start a 10-minute focus', tiny: "Set a timer for 10 minutes. Just start — don't think, just go." },
  { id: 'tomorrow', emoji: '📅', label: 'Move tasks to tomorrow', tiny: "Today's slate is clear. Rest, recharge, come back stronger." },
  { id: 'break', emoji: '🧘', label: 'Quick reset break', tiny: 'Step away for 5 minutes. Breathe, stretch, then return fresh.' },
]
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
  const [focusTask, setFocusTask] = useState(() => load('ff_focusTask', null))
  const [timerSelected, setTimerSelected] = useState(() => {
    const s = load('ff_timer', null)
    return (s && DURATIONS.find(d => d.label === s.selectedLabel)) || DURATIONS[2]
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
    setRestarted(false)
    setRestartOpen(false)
  }

  function resetAllData() {
    if (!window.confirm('Reset all data? This cannot be undone.')) return
    ;['ff_points','ff_tasks','ff_tinyDone','ff_mainGoal','ff_tinyText','ff_habits','ff_rewards','ff_goals','ff_timer','ff_feedbackOn','ff_focusTask'].forEach(k => localStorage.removeItem(k))
    setPoints(0); setTasks(defaultTasks); setTinyDone(false)
    setMainGoal(DEFAULT_GOAL); setTinyText(DEFAULT_TINY)
    setHabits([]); setRewards(DEFAULT_REWARDS); setGoals([])
    setRestartOpen(false); setRestarted(false); setFocusTask(null)
    clearInterval(timerRef.current)
    setTimerSelected(DURATIONS[2]); setTimerEndAt(null); setTimerLeft(null)
    setTimerRunning(false); setTimerCompleted(false); setTimerClaimed(false); setTimerPartial(false)
  }

  function pickRestartOption(opt) {
    setTinyText(opt.tiny); setTinyDone(false)
    if (opt.id === 'tomorrow') setTasks(prev => prev.map(t => ({ ...t, done: false })))
    setRestartOpen(false); setRestarted(true)
    if (opt.id === 'focus10') setTimeout(() => setTab('focus'), 300)
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
    const keys = ['ff_points','ff_tasks','ff_tinyDone','ff_mainGoal','ff_tinyText','ff_habits','ff_rewards','ff_goals','ff_timer','ff_feedbackOn','ff_focusTask']
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

  const tabs = [
    { id: 'today', label: 'Today', icon: '🏠' },
    { id: 'focus', label: 'Focus', icon: '⏱' },
    { id: 'goals', label: 'Goals', icon: '🎯' },
    { id: 'habits', label: 'Habits', icon: '🔁' },
    { id: 'rewards', label: 'Rewards', icon: '🎁' },
  ]
  const doneTasks = tasks.filter(t => t.done).length
  const nextReward = rewards.length > 0
    ? (rewards.filter(r => r.cost > points).sort((a, b) => a.cost - b.cost)[0] || rewards.slice().sort((a, b) => a.cost - b.cost)[0])
    : null
  const pctToReward = nextReward ? Math.min(100, (points / nextReward.cost) * 100) : 0
  const canClaim = nextReward ? points >= nextReward.cost : false

  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",system-ui,sans-serif', maxWidth: 480, margin: '0 auto', minHeight: '100vh', background: C.bg }}>
      <div style={{ background: C.card, borderBottom: `1px solid ${C.border}`, padding: '18px 20px', position: 'sticky', top: 0, zIndex: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: C.textPri, letterSpacing: 0.3 }}><span style={{ color: C.blue }}>Focus</span>Forge</h1>
          {(timerRunning || (timerCompleted && !timerClaimed)) && (
            <button onClick={() => setTab('focus')} style={{ background: timerCompleted ? C.greenLight : C.blueLight, border: `1px solid ${timerCompleted ? C.green : C.blue}`, borderRadius: 24, padding: '5px 12px', fontWeight: 700, fontSize: 12, color: timerCompleted ? C.green : C.blue, cursor: 'pointer', letterSpacing: 0.2, flexShrink: 0 }}>
              {timerCompleted ? '✅ Claim session' : `⏱ ${timerMins}:${timerSecs}`}
            </button>
          )}
          <div style={{ background: C.orange, borderRadius: 24, padding: '5px 14px', fontWeight: 800, fontSize: 13, color: '#fff', letterSpacing: 0.3 }}>{points} pts</div>
        </div>
      </div>

      <div style={{ padding: '16px 14px 104px' }}>
        {tab === 'today' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: '10px 4px 2px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: 1.1, marginBottom: 8 }}>FocusForge</div>
                  <div style={{ fontSize: 28, fontWeight: 800, color: C.textPri, lineHeight: 1.15, letterSpacing: -0.4 }}>Good morning.</div>
                  <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.5, marginTop: 5 }}>You don't need to do everything. Just what matters today.</div>
                </div>
                <div style={{ background: C.orangeLight, border: `1px solid rgba(249,115,22,0.25)`, borderRadius: 18, padding: '9px 13px', color: C.orange, fontWeight: 800, fontSize: 15, whiteSpace: 'nowrap' }}>{points} pts</div>
              </div>
            </div>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <Label>Main Goal</Label>
                  <EditableText value={mainGoal} onChange={setMainGoal} placeholder="What's the one thing that matters today?" multiline />
                </div>
              </div>
            </Card>

            {nextBestTask && (
              <div style={{ background: 'linear-gradient(135deg,#182818 0%,#101c12 100%)', border: `1px solid rgba(34,197,94,0.22)`, borderRadius: 20, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: C.green, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Next Best Action</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.textPri, lineHeight: 1.35 }}>{nextBestTask.text}</div>
                </div>
                <button onClick={() => { setFocusTask({ id: nextBestTask.id, text: nextBestTask.text }); setTab('focus') }} style={{ background: C.green, color: '#07120a', border: 'none', borderRadius: 14, padding: '10px 13px', fontWeight: 800, fontSize: 13, cursor: 'pointer', flexShrink: 0 }}>Start</button>
              </div>
            )}

            {!nextBestTask && (
              <div style={{ background: 'linear-gradient(135deg,#1a2030 0%,#0f1520 100%)', border: `1px solid rgba(249,115,22,0.25)`, borderRadius: 20, padding: '16px 18px' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: C.orange, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>All tasks done</div>
                <div style={{ fontSize: 14, color: C.textSec, marginBottom: 12 }}>Great work. Start a focus session or set a new tiny start.</div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => setTab('focus')} style={{ ...PrimaryBtn, flex: 1, padding: '11px' }}>Focus</button>
                  <button onClick={() => setTinyDone(false)} style={{ ...GhostBtn, flex: 1, padding: '11px' }}>New Start</button>
                </div>
              </div>
            )}

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}><Label>Tiny Start</Label>{tinyDone && <Badge color={C.green}>+2 pts</Badge>}</div>
              <EditableText value={tinyText} onChange={setTinyText} placeholder="One tiny action to get you moving..." disabled={tinyDone} multiline />
              {!tinyDone && <button onClick={completeTiny} style={{ ...PrimaryBtn, marginTop: 12, background: C.orange }}>Start Now</button>}
            </Card>

            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Label>Top 3 Tasks</Label>
                <span style={{ color: C.textMut, fontSize: 12, fontWeight: 700 }}>{doneTasks}/{tasks.length}</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 4 }}>
                {tasks.slice(0, 3).map((task, i) => <TaskRow key={task.id} task={task} index={i} onToggle={() => toggleTask(task.id)} onTextChange={text => updateTaskText(task.id, text)} onFocus={() => { setFocusTask({ id: task.id, text: task.text }); setTab('focus') }} />)}
              </div>
            </Card>

            <button onClick={() => setTab('focus')} style={{ ...PrimaryBtn, padding: '16px 18px', fontSize: 16, background: `linear-gradient(135deg, ${C.orange} 0%, #ef5f46 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ textAlign: 'left' }}><span style={{ display: 'block', fontSize: 17 }}>Start Focus Sprint</span><span style={{ display: 'block', fontSize: 12, opacity: 0.78, fontWeight: 500, marginTop: 2 }}>{timerSelected.label} - distraction-free</span></span>
              <span style={{ width: 42, height: 42, borderRadius: '50%', background: 'rgba(13,15,20,0.72)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800 }}>GO</span>
            </button>

            {restarted && !restartOpen && <div style={{ background: C.greenLight, border: `1px solid rgba(34,197,94,0.25)`, borderRadius: 16, padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 2 }}><div style={{ fontWeight: 700, fontSize: 14, color: C.green }}>Today is still usable.</div><div style={{ fontSize: 12, color: C.textSec }}>Your Tiny Start has been updated. Keep going.</div></div>}

            {restartOpen ? <RestartPanel onPick={pickRestartOption} onCancel={() => setRestartOpen(false)} /> : <button onClick={() => { setRestartOpen(true); setRestarted(false) }} style={{ ...GhostBtn, padding: '15px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', textAlign: 'left' }}><span><span style={{ display: 'block', color: C.textPri, fontSize: 15 }}>Restart My Day</span><span style={{ display: 'block', color: C.textMut, fontSize: 12, marginTop: 2, fontWeight: 500 }}>Clear the slate. Reset your focus.</span></span><span style={{ color: C.textMut }}>More</span></button>}

            <details style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 20, overflow: 'hidden' }}>
              <summary style={{ listStyle: 'none', padding: '15px 18px', color: C.textSec, fontWeight: 800, fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.8, cursor: 'pointer' }}>More options</summary>
              <div style={{ borderTop: `1px solid ${C.border}`, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ background: C.cardAlt, borderRadius: 16, padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ color: C.textSec, fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>Today's Points</div>
                    <div style={{ color: C.textMut, fontSize: 12, marginTop: 3 }}>{doneTasks}/{tasks.length} tasks done</div>
                  </div>
                  <div style={{ color: C.textPri, fontSize: 30, fontWeight: 800 }}>{points}</div>
                </div>

                {nextReward ? (
                  <div style={{ background: C.cardAlt, borderRadius: 16, padding: '14px 16px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}><Label>Next Reward</Label>{canClaim && <Badge color={C.orange}>Ready!</Badge>}</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 46, height: 46, borderRadius: 14, fontSize: 12, fontWeight: 800, color: C.orange, background: C.orangeLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>WIN</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 15, color: C.textPri }}>{nextReward.name}</div>
                        <div style={{ fontSize: 12, color: C.textSec, marginBottom: 7 }}>{canClaim ? 'You can claim this now!' : `${nextReward.cost - points} pts to go`}</div>
                        <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 6, height: 6, overflow: 'hidden' }}><div style={{ height: '100%', width: `${pctToReward}%`, background: canClaim ? C.green : C.orange, borderRadius: 6, transition: 'width 0.4s' }} /></div>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: canClaim ? C.green : C.orange, minWidth: 44, textAlign: 'right' }}>{points}/{nextReward.cost}</div>
                    </div>
                  </div>
                ) : (
                  <div style={{ background: C.cardAlt, borderRadius: 16, padding: '14px 16px', fontSize: 13, color: C.textMut, textAlign: 'center' }}>
                    No rewards set. <button onClick={() => setTab('rewards')} style={{ background: 'none', border: 'none', color: C.blue, cursor: 'pointer', fontWeight: 700, fontSize: 13, padding: 0 }}>Add one</button>
                  </div>
                )}

                <button onClick={startNewDay} style={{ ...GhostBtn, padding: '13px' }}>Start New Day</button>

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
      <div style={{ padding: '20px 16px 112px', textAlign: 'center', borderTop: `1px solid ${C.border}`, marginTop: 8 }}>
        <p style={{ fontSize: 11, color: C.textMut, margin: 0, lineHeight: 1.6 }}>FocusForge is a productivity support tool, not medical treatment or clinical advice.</p>
      </div>
      <nav style={{ position: 'fixed', left: 0, right: 0, bottom: 0, zIndex: 20, background: 'rgba(13,15,20,0.96)', borderTop: `1px solid ${C.border}`, boxShadow: '0 -12px 30px rgba(0,0,0,0.35)', padding: '8px 10px calc(8px + env(safe-area-inset-bottom))' }}>
        <div style={{ maxWidth: 480, margin: '0 auto', display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 4 }}>
          {tabs.map(t => {
            const active = tab === t.id
            return (
              <button key={t.id} onClick={() => setTab(t.id)} style={{ background: active ? C.blueLight : 'transparent', color: active ? C.blue : C.textSec, border: active ? `1px solid rgba(96,165,250,0.35)` : '1px solid transparent', borderRadius: 16, padding: '8px 4px 7px', minHeight: 58, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3, fontWeight: active ? 800 : 600, fontSize: 11, cursor: 'pointer' }}>
                <span style={{ fontSize: 20, lineHeight: 1 }}>{t.icon}</span>
                <span>{t.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}

function RestartPanel({ onPick, onCancel }) {
  return <div style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
    <div style={{ padding: '16px 18px 12px', borderBottom: `1px solid ${C.border}` }}><div style={{ fontWeight: 700, fontSize: 15, color: C.textPri }}>How do you want to restart?</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>Pick what feels right right now.</div></div>
    {RESTART_OPTIONS.map((opt, i) => <button key={opt.id} onClick={() => onPick(opt)} style={{ width: '100%', background: 'transparent', border: 'none', borderBottom: i < RESTART_OPTIONS.length - 1 ? `1px solid ${C.border}` : 'none', padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, textAlign: 'left' }}><span style={{ fontSize: 18, width: 38, height: 38, borderRadius: 12, background: C.cardAlt, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{opt.emoji}</span><span style={{ fontSize: 14, fontWeight: 600, color: C.textPri }}>{opt.label}</span></button>)}
    <div style={{ padding: '10px 18px', borderTop: `1px solid ${C.border}` }}><button onClick={onCancel} style={{ width: '100%', background: 'transparent', border: 'none', color: C.textMut, fontSize: 13, fontWeight: 600, cursor: 'pointer', padding: '6px' }}>Cancel</button></div>
  </div>
}

function EditableText({ value, onChange, placeholder, multiline, disabled }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef()
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  if (!editing) return <div onClick={() => !disabled && setEditing(true)} style={{ fontSize: 14, color: disabled ? C.textMut : C.textPri, lineHeight: 1.6, cursor: disabled ? 'default' : 'text', padding: '9px 12px', borderRadius: 12, background: disabled ? 'transparent' : C.cardAlt, border: `1px solid ${disabled ? 'transparent' : C.border}`, minHeight: 40, display: 'flex', alignItems: 'center' }}>{value || <span style={{ color: C.textMut }}>{placeholder}</span>}{!disabled && <span style={{ marginLeft: 'auto', paddingLeft: 8, color: C.textMut, fontSize: 13 }}>✏️</span>}</div>
  const inputStyle = { width: '100%', fontSize: 14, color: C.textPri, lineHeight: 1.6, padding: '9px 12px', borderRadius: 12, border: `1.5px solid ${C.blue}`, background: C.cardAlt, outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }
  return multiline ? <textarea ref={ref} value={value} rows={2} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} style={inputStyle} /> : <input ref={ref} value={value} onChange={e => onChange(e.target.value)} onBlur={() => setEditing(false)} style={inputStyle} />
}

function TaskRow({ task, index, onToggle, onTextChange, onFocus }) {
  const [editing, setEditing] = useState(false)
  const ref = useRef()
  useEffect(() => { if (editing && ref.current) ref.current.focus() }, [editing])
  return <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: task.done ? 'rgba(34,197,94,0.08)' : C.cardAlt, border: `1px solid ${task.done ? 'rgba(34,197,94,0.2)' : C.border}`, borderRadius: 14, padding: '12px 14px' }}>
    <input type="checkbox" checked={task.done} onChange={onToggle} style={{ width: 18, height: 18, accentColor: C.green, cursor: 'pointer', flexShrink: 0 }} />
    {editing ? <input ref={ref} value={task.text} onChange={e => onTextChange(e.target.value)} onBlur={() => setEditing(false)} onKeyDown={e => e.key === 'Enter' && setEditing(false)} style={{ flex: 1, fontSize: 14, border: 'none', background: 'transparent', outline: 'none', fontFamily: 'inherit', color: C.textPri }} /> : <span onClick={() => !task.done && setEditing(true)} style={{ flex: 1, fontSize: 14, color: task.done ? C.textMut : C.textPri, textDecoration: task.done ? 'line-through' : 'none', cursor: task.done ? 'default' : 'text' }}>{task.text || <span style={{ color: C.textMut }}>Task {index + 1}</span>}</span>}
    {!task.done && <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
      <span style={{ fontSize: 11, color: C.orange, fontWeight: 700 }}>+3</span>
      <button onClick={e => { e.stopPropagation(); onFocus() }} style={{ background: C.blueLight, border: `1px solid ${C.blue}`, borderRadius: 8, padding: '4px 8px', fontSize: 11, fontWeight: 700, color: C.blue, cursor: 'pointer' }}>⚡ Focus</button>
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
      <Field label="Backup plan" field="backup" value={form.backup} placeholder="If things go wrong, I will…" />
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
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}><div style={{ fontWeight: 800, fontSize: 17, color: C.textPri }}>🔁 Habits</div>{!adding && <button onClick={() => setAdding(true)} style={{ background: C.blue, color: '#fff', border: 'none', borderRadius: 12, padding: '8px 16px', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>+ Add habit</button>}</div>
    {adding && <Card><Label>New habit</Label><input ref={inputRef} value={newName} onChange={e => { setNewName(e.target.value); if (nameError) setNameError(false) }} onKeyDown={e => { if (e.key === 'Enter') addHabit(); if (e.key === 'Escape') { setAdding(false); setNameError(false) } }} placeholder="e.g. Drink water, Read, Exercise…" style={{ width: '100%', fontSize: 14, padding: '11px 13px', borderRadius: 12, border: `1.5px solid ${nameError ? C.red : C.blue}`, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box', marginBottom: nameError ? 4 : 10, background: C.cardAlt, color: C.textPri }} />{nameError && <div style={{ fontSize: 12, color: C.red, marginBottom: 8 }}>Habit name is required.</div>}<div style={{ display: 'flex', gap: 8 }}><button onClick={addHabit} style={{ ...PrimaryBtn, flex: 1 }}>Add</button><button onClick={() => { setAdding(false); setNewName(''); setNameError(false) }} style={{ ...GhostBtn, flex: 1 }}>Cancel</button></div></Card>}
    {habits.length === 0 && !adding && <Card><div style={{ textAlign: 'center', padding: '24px 0' }}><div style={{ fontSize: 38, marginBottom: 10 }}>🌱</div><div style={{ fontWeight: 700, fontSize: 15, color: C.textPri, marginBottom: 6 }}>No habits yet</div><div style={{ fontSize: 13, color: C.textSec }}>Add your first habit above to get started.</div></div></Card>}
    {habits.map(habit => <div key={habit.id} style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}><div style={{ padding: '14px 18px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}><div><div style={{ fontWeight: 700, fontSize: 15, color: C.textPri }}>{habit.name}</div><div style={{ fontSize: 12, color: C.textSec, marginTop: 2 }}>{habit.streak > 0 ? `🔥 ${habit.streak} day streak` : 'No streak yet — start today'}</div></div><button onClick={() => setHabits(prev => prev.filter(h => h.id !== habit.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: C.textMut, fontSize: 16, padding: 4 }}>✕</button></div>{habit.todayStatus === 'skip' && habit.skipMsg && <div style={{ margin: '0 14px 12px', background: C.cardAlt, borderRadius: 12, padding: '10px 13px', fontSize: 13, color: C.textSec, fontStyle: 'italic' }}>{habit.skipMsg}</div>}<div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', borderTop: `1px solid ${C.border}` }}>{[{ status: 'full', label: '✅ Full win', pts: '+3', activeColor: C.green, activeBg: C.greenLight }, { status: 'partial', label: '⚡ Partial win', pts: '+1', activeColor: C.orange, activeBg: C.orangeLight }, { status: 'skip', label: '🤍 Skip', pts: '', activeColor: C.textSec, activeBg: C.cardAlt }].map((btn, i) => { const active = habit.todayStatus === btn.status; return <button key={btn.status} onClick={() => markHabit(habit.id, btn.status)} style={{ background: active ? btn.activeBg : 'transparent', border: 'none', borderRight: i < 2 ? `1px solid ${C.border}` : 'none', padding: '13px 4px', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}><span style={{ fontSize: 12, fontWeight: 700, color: active ? btn.activeColor : C.textSec }}>{btn.label}</span>{btn.pts && <span style={{ fontSize: 11, color: active ? btn.activeColor : C.textMut, fontWeight: 600 }}>{btn.pts} pts</span>}</button> })}</div></div>)}
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
        : <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}><div style={{ fontSize: 15, fontWeight: 700, color: C.textPri }}>Session complete — claim your reward</div><button onClick={onClaim} style={{ ...PrimaryBtn, background: C.green }}>Claim +{selected.pts} pts</button><button onClick={onReset} style={GhostBtn}>Discard</button></div>)
        : isIdle
          ? <button onClick={onStart} style={{ ...PrimaryBtn, width: 180, padding: '15px' }}>▶ Start</button>
          : <div style={{ display: 'flex', flexDirection: 'column', gap: 10, width: '100%' }}>
              <div style={{ display: 'flex', gap: 12 }}>{running ? <button onClick={onPause} style={{ ...PrimaryBtn, flex: 1 }}>⏸ Pause</button> : <button onClick={onResume} style={{ ...PrimaryBtn, flex: 1 }}>▶ Resume</button>}<button onClick={onReset} style={{ ...GhostBtn, flex: 1 }}>↺ Reset</button></div>
              {running && <button onClick={onEndEarly} style={{ background: 'rgba(249,115,22,0.12)', border: `1px solid rgba(249,115,22,0.3)`, borderRadius: 14, padding: '11px', color: C.orange, fontWeight: 700, fontSize: 13, cursor: 'pointer', width: '100%' }}>⚡ End early — partial win (+1 pt)</button>}
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

function Card({ children }) { return <div style={{ background: C.card, borderRadius: 20, padding: '16px 18px', border: `1px solid ${C.border}` }}>{children}</div> }
function Label({ children }) { return <div style={{ fontWeight: 700, fontSize: 13, color: C.textSec, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 10 }}>{children}</div> }
function Badge({ children, color }) { return <div style={{ background: color + '22', color, borderRadius: 20, padding: '3px 10px', fontSize: 11, fontWeight: 700 }}>{children}</div> }
function Empty({ children }) { return <p style={{ color: C.textMut, fontSize: 14, margin: 0 }}>{children}</p> }

const PrimaryBtn = { background: C.blue, color: '#fff', border: 'none', borderRadius: 16, padding: '14px 20px', fontWeight: 700, fontSize: 15, cursor: 'pointer', width: '100%' }
const GhostBtn = { background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 16, padding: '13px 20px', color: C.textSec, fontWeight: 600, fontSize: 14, cursor: 'pointer', width: '100%' }
