import { C } from '../constants/colors.js'
import { RestartPanel } from './RestartPanel.jsx'
import { Card, Label, Badge, PrimaryBtn, GhostBtn } from './Card.jsx'
import { EditableText } from './EditableText.jsx'
import { TaskRow } from './TaskRow.jsx'

export function TodayTab({
  nextBestTask,
  goals,
  startFocus,
  setTab,
  setTinyDone,
  tinyDone,
  tinyText,
  tasks,
  toggleTask,
  updateTaskText,
  setFocusTask,
  mainGoal,
  setMainGoal,
  restarted,
  restartOpen,
  moveTasksToTomorrow,
  startNewDay,
  rebuildToday,
  moveTasksForward,
  setRestartOpen,
  setRestarted,
  doneTasks,
  points,
  exportData,
  importRef,
  importData,
  resetAllData,
}) {
  return (
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
  )
}
