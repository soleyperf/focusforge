import { useState, useEffect, useRef } from 'react'
import { C } from '../constants.js'

export function EditableText({ value, onChange, placeholder, multiline, disabled, size }) {
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


export function Card({ children, variant }) { return <div style={{ background: variant === 'goal' ? 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(22,27,38,0.96))' : 'rgba(22,27,38,0.96)', borderRadius: 28, padding: variant === 'goal' ? '24px 22px' : '20px', border: `1px solid ${C.border}`, boxShadow: '0 18px 40px rgba(0,0,0,0.20)' }}>{children}</div> }
export function Label({ children, tone }) { return <div style={{ fontWeight: 850, fontSize: 12, color: tone === 'orange' ? C.orange : tone === 'green' ? '#9fb58d' : C.textSec, textTransform: 'uppercase', letterSpacing: 1.15, marginBottom: 12 }}>{children}</div> }
export function Badge({ children, color }) { return <div style={{ background: color + '22', color, borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 800 }}>{children}</div> }
export function Empty({ children }) { return <p style={{ color: C.textMut, fontSize: 14, margin: 0 }}>{children}</p> }

export const PrimaryBtn = { background: C.blue, color: '#fff', border: 'none', borderRadius: 18, padding: '15px 20px', minHeight: 50, fontWeight: 800, fontSize: 15, cursor: 'pointer', width: '100%', boxShadow: '0 12px 24px rgba(59,130,246,0.18)' }
export const GhostBtn = { background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 20px', minHeight: 48, color: C.textSec, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }


