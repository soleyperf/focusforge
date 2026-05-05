import { C } from '../constants/constants.js'

export function Card({ children, variant }) { return <div style={{ background: variant === 'goal' ? 'linear-gradient(135deg, rgba(255,255,255,0.055), rgba(22,27,38,0.96))' : 'rgba(22,27,38,0.96)', borderRadius: 28, padding: variant === 'goal' ? '24px 22px' : '20px', border: `1px solid ${C.border}`, boxShadow: '0 18px 40px rgba(0,0,0,0.20)' }}>{children}</div> }
export function Label({ children, tone }) { return <div style={{ fontWeight: 850, fontSize: 12, color: tone === 'orange' ? C.orange : tone === 'green' ? '#9fb58d' : C.textSec, textTransform: 'uppercase', letterSpacing: 1.15, marginBottom: 12 }}>{children}</div> }
export function Badge({ children, color }) { return <div style={{ background: color + '22', color, borderRadius: 20, padding: '4px 11px', fontSize: 11, fontWeight: 800 }}>{children}</div> }
export function Empty({ children }) { return <p style={{ color: C.textMut, fontSize: 14, margin: 0 }}>{children}</p> }

export const PrimaryBtn = { background: C.blue, color: '#fff', border: 'none', borderRadius: 18, padding: '15px 20px', minHeight: 50, fontWeight: 800, fontSize: 15, cursor: 'pointer', width: '100%', boxShadow: '0 12px 24px rgba(59,130,246,0.18)' }
export const GhostBtn = { background: 'transparent', border: `1.5px solid ${C.border}`, borderRadius: 18, padding: '14px 20px', minHeight: 48, color: C.textSec, fontWeight: 700, fontSize: 14, cursor: 'pointer', width: '100%' }
