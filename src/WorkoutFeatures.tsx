import { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { buildPlan, estimate, fitToTime, sharedLink, weeklyActivity } from './workoutModel';
import type { useWorkout } from './useWorkout';
import { fmt } from './useWorkout';
import type { Exercise } from './storage';
type Workout = ReturnType<typeof useWorkout>;

export function BuilderExtras({w}:{w:Workout}) {
 return <div className="builder-extras">
  <label>Exercise style<select value={w.mode} onChange={e=>w.setMode(e.target.value as 'timed'|'reps')}><option value="timed">Timed</option><option value="reps">Repetitions · tap Done</option></select></label>
  {w.mode==='reps' && <label>Repetitions per set<input className="num-input" type="number" min={1} max={999} value={w.reps} onChange={e=>w.setReps(Number(e.target.value))}/><span className="muted">Work seconds becomes your estimated time per set; it will not end the set automatically.</span></label>}
  <label>Block name <span className="muted">Optional</span><input className="text-input" placeholder="e.g. Warm-up or Circuit A" maxLength={60} value={w.block} onChange={e=>w.setBlock(e.target.value)}/></label>
  <label>Block style<select value={w.blockType} onChange={e=>w.setBlockType(e.target.value as typeof w.blockType)}><option value="standard">Standard</option><option value="warmup">Warm-up</option><option value="circuit">Circuit</option><option value="superset">Superset</option><option value="cooldown">Cooldown</option></select></label>
  {['circuit','superset'].includes(w.blockType) && <label>Rounds<input className="num-input" type="number" min={1} max={10} value={w.rounds} onChange={e=>w.setRounds(Number(e.target.value))}/></label>}
  <p className="muted">Consecutive exercises with the same block name and style run together. Circuits and supersets repeat that block; the first exercise sets the rounds. Sets run within each round. Your chosen rests stay in place. Choose 0 seconds of rest for immediate transitions.</p>
 </div>;
}
export function Preview({w}:{w:Workout}) {
 const [minutes,setMinutes]=useState(15), [draft,setDraft]=useState<Exercise[]|null>(null);
 useEffect(()=>setDraft(null),[w.queue]);
 const plan=w.plan, work=plan.filter(p=>p.phase==='work').reduce((s,p)=>s+p.seconds,0), rest=w.totalSeconds-work;
 return <section className="feature-card"><h2>Workout preview</h2>
  <label className="workout-name">Workout name<input className="text-input" maxLength={80} value={w.workoutName} onChange={e=>w.setWorkoutName(e.target.value)}/></label>
  <div className="preview-totals"><span><strong>{fmt(w.totalSeconds)}</strong> estimated total</span><span>{fmt(work)} work</span><span>{fmt(rest)} rest</span><span>{w.totalSets} sets</span></div>
  <div className="workout-timeline" role="img" aria-label="Workout sequence: green work, blue short rest, amber long rest">{plan.slice(0,200).map((p,i)=><span key={i} className={'segment '+p.phase} style={{flexGrow:p.seconds}} title={`${w.queue[p.exIdx].name} · ${p.phase} · ${p.seconds}s${p.manual?' estimated':''}`}/>)}</div>
  <p className="muted">Green: work · Blue: short rest · Amber: long rest. {w.settings.preparation ? `Plus ${w.settings.preparation}s preparation.` : ''} {w.queue.some(ex=>ex.mode==='reps')?'Repetition times are estimates; finish each set with Done.':''} {plan.length>200?'Timeline shows the first 200 phases.':''}</p>
  <details><summary>See exercise order and rounds</summary><ol className="preview-order">{plan.filter(p=>p.phase==='work').slice(0,200).map((p,i)=><li key={i}>{w.queue[p.exIdx].block && <span className="tag tag-sets">{w.queue[p.exIdx].block}</span>} {w.queue[p.exIdx].name} · Set {p.setIdx+1}{p.rounds>1?` · Round ${p.round}/${p.rounds}`:''} · {p.manual?w.queue[p.exIdx].reps+' reps':p.seconds+'s'}</li>)}</ol>{w.totalSets>200&&<p className="muted">First 200 sets shown.</p>}</details>
  <div className="fit-controls"><h3>Fit my time</h3><p className="muted">Review fewer sets or exercises. Rest durations and rounds stay unchanged; saved routines are untouched.</p><div className="inline-controls"><label>Minutes<input className="num-input" type="number" min={1} max={180} value={minutes} onChange={e=>setMinutes(Number(e.target.value))}/></label><button className="small-button" disabled={!!w.editingId||!w.queue.length||!Number.isInteger(minutes)||minutes<1||minutes>180} onClick={()=>setDraft(fitToTime(w.queue,minutes*60))}>Preview adjustment</button></div>
   {draft && <div className="fit-review" role="status">{draft.length ? <><strong>Proposed: {fmt(estimate(draft))} · {buildPlan(draft).filter(p=>p.phase==='work').length} sets</strong><ul>{w.queue.map(ex=>{const next=draft.find(d=>d.id===ex.id);return <li key={ex.id}>{ex.name}: {next ? `${ex.sets} → ${next.sets} sets per round` : 'remove from this workout'}</li>;})}</ul><button className="small-button" onClick={()=>{w.applyFit(draft);setDraft(null);}}>Apply to queue</button></> : <p>No exercise fits that time with your current rests and rounds. Try a longer duration.</p>} <button className="small-button" onClick={()=>setDraft(null)}>Cancel</button></div>}
  </div>
  <ShareRoutine w={w}/>
 </section>;
}
function ShareRoutine({w}:{w:Workout}) {
 const [link,setLink]=useState(''),[qr,setQr]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{setLink('');setQr('');setMessage('');},[w.queue,w.workoutName]);
 useEffect(()=>{let cancelled=false;setQr('');if(link) QRCode.toDataURL(link,{width:280,margin:2,errorCorrectionLevel:'L'}).then(url=>{if(!cancelled)setQr(url);}).catch(()=>{if(!cancelled)setMessage('This routine is too large for a QR code. Use the link or export a backup.');});return ()=>{cancelled=true;};},[link]);
 return <div className="share-section"><h3>Share this workout</h3><p className="muted">The link contains this routine. Anyone with it can load a copy. Notes and history are excluded.</p><button className="small-button" disabled={!w.queue.length||!!w.editingId} onClick={()=>setLink(sharedLink(w.workoutName,w.queue))}>Create share link & QR</button>{link && <div className="share-result"><textarea aria-label="Shareable routine link" readOnly value={link}/><button className="small-button" onClick={async()=>{try{await navigator.clipboard.writeText(link);setMessage('Link copied');}catch{setMessage('Select and copy the link above.');}}}>Copy link</button>{qr && <><img src={qr} width="220" height="220" alt="QR code for this workout"/><a className="small-button" href={qr} download="corepulse-routine-qr.png">Download QR</a></>}<p role="status" className="muted">{message}</p></div>}</div>;
}
export function Preferences({w}:{w:Workout}) {
 return <div className="settings-grid extra-preferences">
  <label>Coaching style<select value={w.settings.coaching??'essential'} onChange={e=>w.setSettings({...w.settings,coaching:e.target.value as 'quiet'|'essential'|'encouraging'})}><option value="quiet">Quiet · visuals only</option><option value="essential">Essential cues</option><option value="encouraging">Encouraging</option></select></label>
  <label><input type="checkbox" checked={!!w.settings.vibration} onChange={e=>w.setSettings({...w.settings,vibration:e.target.checked})}/> Vibration cues when supported</label>
  <label><input type="checkbox" checked={!!w.settings.compact} onChange={e=>w.setSettings({...w.settings,compact:e.target.checked})}/> Compact workout view</label>
  <label><input type="checkbox" checked={!!w.settings.reducedMotion} onChange={e=>w.setSettings({...w.settings,reducedMotion:e.target.checked})}/> Reduce motion</label>
  <label>Appearance<select value={w.settings.theme??'dark'} onChange={e=>w.setSettings({...w.settings,theme:e.target.value as 'dark'|'light'})}><option value="dark">Dark</option><option value="light">Light</option></select></label>
 </div>;
}
export function WeeklyProgress({w}:{w:Workout}) {
 const [offset,setOffset]=useState(0);const date=new Date();date.setDate(date.getDate()+offset*7);
 const days=weeklyActivity(w.history,date), sessions=days.reduce((sum,d)=>sum+d.count,0), seconds=days.reduce((sum,d)=>sum+d.seconds,0), count=days.filter(d=>d.count).length;
 return <section className="feature-card"><h2>Your weekly activity</h2><div className="inline-controls"><button className="small-button" onClick={()=>setOffset(n=>n-1)} aria-label="Previous week">←</button><span>{days[0].date.toLocaleDateString()} – {days[6].date.toLocaleDateString()}</span><button className="small-button" disabled={offset>=0} onClick={()=>setOffset(n=>n+1)} aria-label="Next week">→</button></div><div className="preview-totals"><strong>{sessions} sessions</strong><span>{Math.round(seconds/60)} minutes</span><span>{count} active days / 7</span></div><div className="week-bars">{days.map(d=><div key={d.label} className="week-day" aria-label={`${d.label}: ${d.count} sessions, ${Math.round(d.seconds/60)} minutes`}><div className="week-track"><span style={{height:d.count?Math.max(8,d.seconds/Math.max(1,...days.map(day=>day.seconds))*100)+'%':'0%'}}/></div><strong>{d.label}</strong><small>{d.count}</small></div>)}</div><p className="muted">Finished sessions, including sessions with skipped phases. Based on the last 100 sessions saved on this browser.</p></section>;
}
export function CompletionExtras({w}:{w:Workout}) {
 const [error,setError]=useState('');const session=w.session;
 if(!session)return null;
 async function downloadCard(){if(!session)return;try{
  const canvas=document.createElement('canvas');canvas.width=1080;canvas.height=1080;const ctx=canvas.getContext('2d');if(!ctx)throw Error();
  ctx.fillStyle='#0f172a';ctx.fillRect(0,0,1080,1080);ctx.fillStyle='#38bdf8';ctx.font='bold 34px sans-serif';ctx.fillText('COREPULSE',80,110);
  ctx.fillStyle='#e2e8f0';ctx.font='bold 48px sans-serif';wrap(ctx,session.name??'Workout complete',80,245,920,60,3);
  ctx.fillStyle='#94a3b8';ctx.font='30px sans-serif';ctx.fillText(new Date(session.date).toLocaleDateString(),80,420);
  ctx.fillStyle='#22c55e';ctx.font='bold 80px sans-serif';ctx.fillText(fmt(session.seconds),80,560);
  ctx.fillStyle='#e2e8f0';ctx.font='32px sans-serif';ctx.fillText(`${session.exercises} exercises · ${session.sets} planned sets`,80,635);
  ctx.fillStyle='#f59e0b';ctx.fillText(session.skipped?'Includes skipped phases':'All planned sets completed',80,695);
  ctx.fillStyle='#94a3b8';ctx.font='28px sans-serif';wrap(ctx,session.note??'Stay consistent. Stay strong.',80,800,920,40,5);
  const url=canvas.toDataURL('image/png'),link=document.createElement('a');link.href=url;link.download='corepulse-workout.png';link.click();setError('');
 }catch{setError('Could not create the card in this browser.');}}
 return <div className="completion-extras"><label>How did it feel?<select value={session.feedback??''} onChange={e=>w.updateFeedback(e.target.value,session.note??'')}><option value="">Choose feedback</option>{['Too easy','Just right','Too hard'].map(label=><option key={label}>{label}</option>)}</select></label><label>Personal note<textarea maxLength={280} placeholder="What went well today?" value={session.note??''} onChange={e=>w.updateFeedback(session.feedback??'',e.target.value)}/></label><p className="muted">Feedback saves automatically. Your note will appear on the downloaded card.</p><button className="small-button" onClick={()=>void downloadCard()}>Download completion card</button>{error&&<p role="status">{error}</p>}</div>;
}
function wrap(ctx:CanvasRenderingContext2D,text:string,x:number,y:number,width:number,lineHeight:number,maxLines:number){
 const words=Array.from(text);let line='',lines=0;
 for(let i=0;i<words.length;i++){const test=line+words[i];if(ctx.measureText(test).width>width&&line){ctx.fillText(line,x,y);y+=lineHeight;line='';lines++;if(lines>=maxLines)return;}line+=words[i];}if(line&&lines<maxLines)ctx.fillText(line,x,y);
}

export function ShareInvitation({w}:{w:Workout}) {
 const dialog=useRef<HTMLDialogElement>(null);
 useEffect(()=>{if(w.sharedRoutine && dialog.current && !dialog.current.open) {if(typeof dialog.current.showModal==='function')dialog.current.showModal();else dialog.current.setAttribute('open','');}},[w.sharedRoutine]);
 if(!w.sharedRoutine)return null;
 return <dialog ref={dialog} className="share-dialog" aria-labelledby="shareTitle" onCancel={w.dismissShare}><h2 id="shareTitle">Load shared workout?</h2><p>{w.sharedRoutine.name} / {w.sharedRoutine.exercises.length} exercises</p><p className="muted">This replaces your current queue. You can undo it afterward.</p><div className="inline-controls"><button className="small-button" onClick={w.acceptShare}>Load workout</button><button className="small-button" onClick={w.dismissShare}>Cancel</button></div></dialog>;
}
