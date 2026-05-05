import { C } from '../constants/colors.js'

export function RestartPanel({ onStartNewDay, onRebuildToday, onMoveTasks, onCancel }) {
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

