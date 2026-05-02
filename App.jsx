import { useState } from 'react'

export default function App(){
 const [points,setPoints]=useState(0)
 const [tab,setTab]=useState('today')

 return (
 <div style={{padding:20}}>
 <h1>FocusForge</h1>
 <div style={{display:'flex',gap:10}}>
 {['today','focus','goals','habits','rewards'].map(t=> (
 <button key={t} onClick={()=>setTab(t)}>{t}</button>
 ))}
 </div>

 {tab==='today' && (
 <div>
 <h2>Today</h2>
 <p>Main Goal: Do one useful thing</p>
 <p>Tiny Start: Work 5 minutes</p>
 <p>Points: {points}</p>
 <button onClick={()=>setPoints(points+3)}>Complete Focus (+3)</button>
 </div>
 )}

 {tab==='focus' && (
 <div>
 <h2>Focus</h2>
 <button onClick={()=>setPoints(points+3)}>Finish Session (+3)</button>
 </div>
 )}

 {tab==='goals' && <h2>Goals</h2>}
 {tab==='habits' && <h2>Habits</h2>}
 {tab==='rewards' && <h2>Rewards</h2>}
 </div>
 )
}