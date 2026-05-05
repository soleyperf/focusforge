import { useState, useEffect } from 'react'
import { C } from '../constants/colors.js'
import { hasCustomTasks } from '../constants/defaults.js'
import { Label, PrimaryBtn, GhostBtn } from './Card.jsx'

export function SetupScreen({ tasks, goals, onBuild }) {
  const initialTexts = Array.isArray(tasks) && hasCustomTasks(tasks) ? tasks.map(t => t.text || '').slice(0, 5) : ['', '', '']
  const [inputs, setInputs] = useState(() => initialTexts.length >= 3 ? initialTexts : ['', '', ''])
  const [mainTask, setMainTask] = useState('')
  const [tinyTask, setTinyTask] = useState('')
  const [goalMode, setGoalMode] = useState('skip')
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [quickGoalName, setQuickGoalName] = useState('')
  const [quickGoalWhy, setQuickGoalWhy] = useState('')
  const validTasks = inputs.map(t => t.trim()).filter(Boolean)
  const canBuild = validTasks.length >= 3
  const selectedMain = mainTask && validTasks.includes(mainTask) ? mainTask : validTasks[0] || ''
  const tinyOptions = validTasks.filter(task => task !== selectedMain)
  const selectedTiny = tinyTask && tinyOptions.includes(tinyTask) ? tinyTask : tinyOptions[0] || ''
  useEffect(() => {
    if (canBuild && !validTasks.includes(mainTask)) setMainTask(validTasks[0])
    if (canBuild && !tinyOptions.includes(tinyTask)) setTinyTask(tinyOptions[0] || '')
  }, [canBuild, mainTask, tinyTask, validTasks.join('|')])
  const updateInput = (index, value) => setInputs(prev => prev.map((item, i) => i === index ? value : item))
  const submit = () => {
    if (!canBuild) return
    if (goalMode === 'add' && quickGoalName.trim()) {
      const quickGoal = { id: Date.now(), name: quickGoalName.trim(), why: quickGoalWhy.trim(), timeframe: '' }
      onBuild(inputs, selectedMain, selectedTiny, { quickGoal })
      return
    }
    onBuild(inputs, selectedMain, selectedTiny, { goalId: goalMode === 'choose' ? selectedGoalId : null })
  }
  const choiceButton = (task, active, onClick) => <button key={task} onClick={onClick} style={{ background: active ? C.orangeLight : 'rgba(255,255,255,0.025)', border: `1.5px solid ${active ? C.orange : C.border}`, borderRadius: 16, padding: '13px 14px', color: active ? C.textPri : C.textSec, fontWeight: active ? 850 : 650, fontSize: 14, textAlign: 'left', cursor: 'pointer', display: 'flex', gap: 10, alignItems: 'center' }}><span style={{ width: 22, height: 22, borderRadius: '50%', border: `1.5px solid ${active ? C.orange : C.border}`, background: active ? C.orange : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#1a1208', fontSize: 12, fontWeight: 900 }}>{active ? '✓' : ''}</span><span>{task}</span></button>
  const goalOption = (mode, label) => <button key={mode} onClick={() => setGoalMode(mode)} style={{ background: goalMode === mode ? C.blueLight : 'rgba(255,255,255,0.025)', border: `1.5px solid ${goalMode === mode ? C.blue : C.border}`, borderRadius: 14, padding: '11px 10px', color: goalMode === mode ? C.blue : C.textSec, fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>{label}</button>
  return <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
    <div style={{ padding: '4px 2px 0' }}>
      <div style={{ fontSize: 13, color: C.textSec, lineHeight: 1.5 }}>Get it out of your head. We'll turn it into a plan.</div>
    </div>
    <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(22,27,38,0.96))', border: `1px solid ${C.border}`, borderRadius: 28, padding: 20, boxShadow: '0 18px 40px rgba(0,0,0,0.20)' }}>
      <div style={{ fontSize: 25, fontWeight: 900, color: C.textPri, letterSpacing: -0.4, marginBottom: 6 }}>Brain dump your tasks</div>
      <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.5, marginBottom: 18 }}>Add at least 3 things. They do not need to be perfect.</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {inputs.map((value, i) => <input key={i} value={value} onChange={e => updateInput(i, e.target.value)} placeholder={`Task ${i + 1}`} style={{ width: '100%', minHeight: 54, borderRadius: 16, border: `1.5px solid ${C.border}`, background: C.cardAlt, color: C.textPri, padding: '14px 15px', fontSize: 16, outline: 'none', fontFamily: 'inherit' }} />)}
      </div>
      <button onClick={() => setInputs(prev => [...prev, ''])} style={{ ...GhostBtn, marginTop: 12, padding: '12px 14px', minHeight: 46 }}>+ Add another task</button>
      {canBuild && <div style={{ marginTop: 20 }}>
        <Label tone="green">Pick the one that matters most today</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {validTasks.map(task => choiceButton(task, selectedMain === task, () => setMainTask(task)))}
        </div>
        <div style={{ height: 14 }} />
        <Label tone="orange">Pick a Side Quest</Label>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {tinyOptions.map(task => choiceButton(task, selectedTiny === task, () => setTinyTask(task)))}
        </div>
        <div style={{ height: 14 }} />
        <Label>Does your Main Quest support a bigger goal?</Label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {goalOption('skip', 'Skip for now')}
          {goalOption('choose', 'Choose existing goal')}
          {goalOption('add', 'Add quick goal')}
        </div>
        {goalMode === 'choose' && goals.length > 0 && <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 10 }}>
          {goals.map(goal => <button key={goal.id} onClick={() => setSelectedGoalId(goal.id)} style={{ background: selectedGoalId === goal.id ? C.blueLight : 'rgba(255,255,255,0.025)', border: `1.5px solid ${selectedGoalId === goal.id ? C.blue : C.border}`, borderRadius: 14, padding: '11px 12px', color: selectedGoalId === goal.id ? C.textPri : C.textSec, fontWeight: 750, textAlign: 'left', cursor: 'pointer' }}>{goal.name || goal.title}</button>)}
        </div>}
        {goalMode === 'add' && <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginTop: 10 }}>
          <input value={quickGoalName} onChange={e => setQuickGoalName(e.target.value)} placeholder="Goal name" style={{ width: '100%', minHeight: 48, borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.cardAlt, color: C.textPri, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
          <input value={quickGoalWhy} onChange={e => setQuickGoalWhy(e.target.value)} placeholder="Why it matters (optional)" style={{ width: '100%', minHeight: 48, borderRadius: 14, border: `1.5px solid ${C.border}`, background: C.cardAlt, color: C.textPri, padding: '12px 14px', fontSize: 14, outline: 'none', fontFamily: 'inherit' }} />
        </div>}
      </div>}
      <button onClick={submit} disabled={!canBuild} style={{ ...PrimaryBtn, marginTop: 20, background: canBuild ? `linear-gradient(135deg, ${C.orange} 0%, #ef5f46 100%)` : C.cardAlt, color: canBuild ? '#fff' : C.textMut, cursor: canBuild ? 'pointer' : 'not-allowed', boxShadow: canBuild ? '0 18px 34px rgba(249,115,22,0.24)' : 'none' }}>{canBuild ? 'Build My Focus Plan' : 'Add at least 3 tasks'}</button>
    </div>
  </div>
}

