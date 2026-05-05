import { useState } from 'react'
import { C, DURATIONS } from '../constants.js'
import { Card, Label, PrimaryBtn, GhostBtn } from './ui.jsx'

export function FocusTimer({ selected, setSelected, timeLeft, running, completed, claimed, partial, feedbackOn, setFeedbackOn, onStart, onPause, onResume, onReset, onClaim, onEndEarly, focusTask, onClearFocusTask, onRestartDay }) {
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

