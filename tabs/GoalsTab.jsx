import { useState, useEffect, useRef } from 'react'
import { C } from '../constants.js'
import { Label, PrimaryBtn, GhostBtn } from '../components/ui.jsx'

export function GoalsTab({ goals, setGoals, tasks }) {
  const [adding, setAdding] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ name: '', why: '', timeframe: '' })
  const [nameError, setNameError] = useState(false)
  const nameRef = useRef()
  useEffect(() => { if ((adding || editingId) && nameRef.current) nameRef.current.focus() }, [adding, editingId])

  function blankForm() { return { name: '', why: '', timeframe: '' } }

  function startAdd() { setEditingId(null); setForm(blankForm()); setAdding(true) }

  function startEdit(goal) {
    setAdding(false)
    setEditingId(goal.id)
    setForm({ name: goal.name || goal.title || '', why: goal.why || '', timeframe: goal.timeframe || '' })
  }

  function cancelForm() { setAdding(false); setEditingId(null); setNameError(false) }

  function saveAdd() {
    const name = form.name.trim()
    if (!name) { setNameError(true); return }
    setNameError(false)
    setGoals(prev => [...prev, { id: Date.now(), name, why: form.why, timeframe: form.timeframe }])
    setAdding(false)
  }

  function saveEdit() {
    const name = form.name.trim()
    if (!name) { setNameError(true); return }
    setNameError(false)
    setGoals(prev => prev.map(g => g.id === editingId ? { ...g, name, why: form.why, timeframe: form.timeframe } : g))
    setEditingId(null)
  }

  function deleteGoal(id) { setGoals(prev => prev.filter(g => g.id !== id)) }

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
      <Field label="Timeframe" field="timeframe" value={form.timeframe} placeholder="e.g. this month, 12 weeks, by summer" />
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
        const linkedTasks = tasks.filter(task => task.goalId === goal.id)
        return (
          <div key={goal.id} style={{ background: C.card, borderRadius: 20, border: `1px solid ${C.border}`, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: goal.why || goal.timeframe || linkedTasks.length ? 10 : 0 }}>
                <div style={{ fontWeight: 700, fontSize: 16, color: C.textPri, flex: 1, paddingRight: 10 }}>{goal.name || goal.title}</div>
                <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                  <button onClick={() => startEdit(goal)} style={{ background: C.cardAlt, color: C.textSec, border: `1px solid ${C.border}`, borderRadius: 9, padding: '5px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Edit</button>
                  <button onClick={() => deleteGoal(goal.id)} style={{ background: 'rgba(239,68,68,0.1)', color: C.red, border: `1px solid rgba(239,68,68,0.2)`, borderRadius: 9, padding: '5px 10px', fontWeight: 600, fontSize: 12, cursor: 'pointer' }}>Delete</button>
                </div>
              </div>
              {goal.why && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Why: </span>{goal.why}</div>}
              {goal.timeframe && <div style={{ fontSize: 13, color: C.textSec, marginBottom: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Timeframe: </span>{goal.timeframe}</div>}
              {linkedTasks.map(task => <div key={task.id} style={{ fontSize: 13, color: C.textSec, marginTop: 6 }}><span style={{ color: C.textMut, fontWeight: 600 }}>Today: </span>{task.text}</div>)}
            </div>
          </div>
        )
      })}
    </div>
  )
}

