import { useState, useEffect, useRef } from 'react'
import { C } from '../constants/colors.js'
import { Card, Label, Empty, PrimaryBtn, GhostBtn } from './Card.jsx'

export function RewardsTab({ points, rewards, setRewards, onClaim }) {
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

