import { useState, useEffect, useRef } from 'react'
import { C } from '../constants/colors.js'

export function TaskRow({ task, index, onToggle, onTextChange, onFocus, variant }) {
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
