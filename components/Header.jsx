import { C } from '../constants/constants.js'

export function Header({ timerRunning, timerCompleted, timerClaimed, timerMins, timerSecs, points, setTab }) {
  return (
    <div style={{ background: 'rgba(13,15,20,0.94)', borderBottom: `1px solid ${C.border}`, padding: '26px 22px 18px', position: 'sticky', top: 0, zIndex: 10, boxShadow: '0 10px 28px rgba(0,0,0,0.22)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0, fontSize: 34, fontWeight: 900, color: C.textPri, letterSpacing: -1.2, lineHeight: 1 }}><span>Focus</span><span style={{ color: '#fb7b53' }}>Forge</span></h1>
        {(timerRunning || (timerCompleted && !timerClaimed)) && (
          <button onClick={() => setTab('focus')} style={{ background: timerCompleted ? C.greenLight : C.blueLight, border: `1px solid ${timerCompleted ? C.green : C.blue}`, borderRadius: 24, padding: '5px 12px', fontWeight: 700, fontSize: 12, color: timerCompleted ? C.green : C.blue, cursor: 'pointer', letterSpacing: 0.2, flexShrink: 0 }}>
            {timerCompleted ? '✅ Claim session' : `⏱ ${timerMins}:${timerSecs}`}
          </button>
        )}
        <div style={{ background: 'rgba(255,255,255,0.045)', border: `1px solid ${C.border}`, borderRadius: 24, padding: '9px 14px', fontWeight: 850, fontSize: 16, color: '#fb7b53', letterSpacing: 0.2, boxShadow: '0 8px 18px rgba(0,0,0,0.22)' }}>🔥 {points}</div>
      </div>
    </div>
  )
}
