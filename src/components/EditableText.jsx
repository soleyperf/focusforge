import { useState, useEffect, useRef } from 'react'
import { C } from '../constants/colors.js'

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
