import { useEffect, useRef, useState } from 'react';

import { defaults, readStored, validQueue, validRoutines, validSettings, validHistory, parseBackup } from './storage';
import type { Exercise, Routine, Settings, Session } from './storage';
type Phase = 'idle' | 'prepare' | 'work' | 'short' | 'long';
type Preset = 'beginner' | 'intermediate' | 'advanced';
const PRESETS: Record<Preset, Omit<Exercise, 'id'>[]> = {
 beginner: [{name:'Push-ups',sets:3,work:30,shortRest:45,longRest:90},{name:'Squats',sets:3,work:30,shortRest:45,longRest:90}],
 intermediate: [{name:'Push-ups',sets:4,work:45,shortRest:30,longRest:90},{name:'Squats',sets:4,work:45,shortRest:30,longRest:90},{name:'Plank',sets:3,work:40,shortRest:30,longRest:90}],
 advanced: [{name:'Burpees',sets:5,work:60,shortRest:20,longRest:60},{name:'Pull-ups',sets:5,work:50,shortRest:20,longRest:60},{name:'Deadlift',sets:4,work:50,shortRest:25,longRest:60},{name:'Shoulder Press',sets:4,work:45,shortRest:20,longRest:60}],
};
export const fmt = (seconds: number) => {
 const s = Math.max(0, Math.ceil(seconds));
 return `${String(Math.floor(s/60)).padStart(2,'0')}:${String(s%60).padStart(2,'0')}`;
};
export function useWorkout() {
 const [queue,setQueue] = useState<Exercise[]>(() => readStored('corepulse.queue', [], validQueue));
 const [routines,setRoutines] = useState<Routine[]>(() => readStored('corepulse.routines',[],validRoutines));
 const [history,setHistory] = useState<Session[]>(() => readStored('corepulse.history',[],validHistory));
 const [settings,setSettings] = useState<Settings>(() => readStored('corepulse.settings',defaults,validSettings));
 const [storageError,setStorageError] = useState(false);
 const [editingId,setEditingId] = useState<string | null>(null);
 const [routineName,setRoutineName] = useState('');
 const [fullscreen,setFullscreen] = useState(false);
 const skipped = useRef(false);
 const audio = useRef<AudioContext | null>(null);
 const settingsRef = useRef(settings); settingsRef.current = settings;
 const transitioning = useRef(false);
 const [preset,setPreset] = useState<Preset | null>(null);
 const [exercise,setExercise] = useState(''); const [customName,setCustomName] = useState('');
 const [phase,setPhase] = useState<Phase>('idle');
 const [active,setActive] = useState(false); const [complete,setComplete] = useState(false); const [paused,setPaused] = useState(false);
 const [exIdx,setExIdx] = useState(0); const [setIdx,setSetIdx] = useState(0);
 const [remaining,setRemaining] = useState(0); const [duration,setDuration] = useState(0);
 const [elapsed,setElapsed] = useState(0); const [toast,setToast] = useState('');
 const deadline = useRef(0); const savedRemaining = useRef(0); const started = useRef(0); const lastTick = useRef(-1);
 const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
 const current = queue[exIdx];
 useEffect(() => {
  try {
   localStorage.setItem('corepulse.queue',JSON.stringify(queue));
   localStorage.setItem('corepulse.routines',JSON.stringify(routines));
   localStorage.setItem('corepulse.history',JSON.stringify(history));
   localStorage.setItem('corepulse.settings',JSON.stringify(settings)); setStorageError(false);
  } catch { setStorageError(true); }
 },[queue,routines,history,settings]);
 useEffect(() => {
  const changed = () => setFullscreen(Boolean(document.fullscreenElement));
  document.addEventListener('fullscreenchange',changed); return () => document.removeEventListener('fullscreenchange',changed);
 },[]);
 useEffect(() => {
  if(!active || !settings.keepAwake || !('wakeLock' in navigator)) return;
  let cancelled = false; let lock: WakeLockSentinel | undefined;
  const request = async () => {
   if(document.visibilityState !== 'visible' || (lock && !lock.released)) return;
   try { const next = await navigator.wakeLock.request('screen'); if(cancelled) await next.release(); else lock = next; } catch { /* Browser may decline screen wake lock. */ }
  };
  void request(); document.addEventListener('visibilitychange',request);
  return () => { cancelled=true; void lock?.release(); document.removeEventListener('visibilitychange',request); };
 },[active,settings.keepAwake]);
 useEffect(() => () => { void audio.current?.close(); if('speechSynthesis' in window) speechSynthesis.cancel(); },[]);
 function cue(text: string) {
  if(settingsRef.current.voice && 'speechSynthesis' in window) { speechSynthesis.cancel(); speechSynthesis.speak(new SpeechSynthesisUtterance(text)); }
 }
 function sound(frequency = 880, duration = .15, type: OscillatorType = 'square', gain = .35) {
  if(!settingsRef.current.sound) return;
  try {
   const ctx = audio.current; if(!ctx) return;
   const osc=ctx.createOscillator(), vol=ctx.createGain(); osc.connect(vol); vol.connect(ctx.destination);
   osc.frequency.value=frequency; osc.type=type; vol.gain.setValueAtTime(gain,ctx.currentTime);
   vol.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration); osc.start(); osc.stop(ctx.currentTime+duration);
  } catch { /* Audio is optional. */ }
 }
 function showToast(message: string) {
  setToast(message); clearTimeout(toastTimer.current); toastTimer.current = setTimeout(() => setToast(''),2600);
 }
 useEffect(() => () => clearTimeout(toastTimer.current),[]);
 useEffect(() => {
  if(phase !== 'idle') document.body.classList.add(`phase-${phase}`);
  return () => document.body.classList.remove(`phase-${phase}`);
 },[phase]);
 useEffect(() => { if(exercise === '--- CUSTOM ---') document.getElementById('exerciseName')?.focus(); else setCustomName(''); },[exercise]);
 function beginPhase(next: Phase,seconds: number, name = current?.name) {
  transitioning.current=false;
  cue(next === 'prepare' ? 'Get ready' : next === 'work' ? 'Work. '+(name ?? '') : next === 'short' ? 'Rest' : 'Long rest');
  setPhase(next); setDuration(seconds); setRemaining(seconds); savedRemaining.current = seconds;
  deadline.current = performance.now()+seconds*1000; lastTick.current = -1; setPaused(false);
 }
 function finishWorkout() {
  setActive(false); setComplete(true); setPhase('idle'); setPaused(false);
  const seconds=Math.round((Date.now()-started.current)/1000);
  setHistory(items => [{id:crypto.randomUUID(),date:new Date().toISOString(),exercises:queue.length,sets:queue.reduce((sum,ex)=>sum+ex.sets,0),seconds,skipped:skipped.current},...items].slice(0,100));
  cue('Workout complete');
  setElapsed(seconds); sound(1047,0.5,'triangle');
 }
 function advance() {
  if(!active || !current || transitioning.current) return;
  transitioning.current=true;
  if(phase === "prepare") { started.current=Date.now(); beginPhase("work",current.work); return; }
  if(phase === 'work') {
   sound(880,0.2); 
   if(setIdx < current.sets-1) { setSetIdx(setIdx+1); beginPhase('short',current.shortRest); showToast(`Set ${setIdx+1} done! Rest up.`); }
   else if(exIdx < queue.length-1) { setSetIdx(current.sets); beginPhase('long',current.longRest); showToast(`${current.name} complete! Long rest coming.`); }
   else finishWorkout();
  } else if(phase === 'short') { sound(660,0.2,'triangle'); beginPhase('work',current.work); }
  else if(phase === 'long') { sound(660,0.2,'triangle'); setExIdx(exIdx+1); setSetIdx(0); beginPhase('work',queue[exIdx+1].work,queue[exIdx+1].name); }
 }
 useEffect(() => {
  if(!active || paused || phase === 'idle') return;
  let frame: number;
  function tick() {
   const left = Math.max(0,(deadline.current-performance.now())/1000);
   setRemaining(Math.ceil(left)); savedRemaining.current = left;
   const second = Math.ceil(left);
   if(second > 0 && second <= 3 && second !== lastTick.current) { lastTick.current = second; sound(1100,0.07,'square',0.2); }
   if(left <= 0) { advance(); return; }
   frame = requestAnimationFrame(tick);
  }
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
 // A new phase or pause owns a fresh loop; remaining updates do not restart it.
 },[active,paused,phase,exIdx,setIdx]);
 function addExerciseToQueue() {
  const name = exercise === '--- CUSTOM ---' ? customName.trim() : exercise;
  if(!name) { showToast(exercise ? 'Please type a custom exercise name' : 'Please select an exercise'); return; }
  const value = (id: string) => Number((document.getElementById(id) as HTMLInputElement).value);
  const sets=value('exSets'),work=value('exWork'),shortRest=value('exShortRest'),longRest=value('exLongRest');
  for(const [label,n,min,max] of [['Sets',sets,1,20],['Work',work,5,3600],['Short rest',shortRest,5,600],['Long rest',longRest,10,600]] as const) {
   if(!Number.isInteger(n) || n < min || n > max) { showToast(`${label} must be a whole number from ${min} to ${max}`); return; }
  }
  if(name.length > 100) { showToast('Keep exercise names under 100 characters'); return; }
  if(!editingId && queue.length >= 100) { showToast('Maximum 100 exercises per workout'); return; }
  const entry={id:editingId ?? crypto.randomUUID(),name,sets,work,shortRest,longRest};
  setQueue(q => editingId ? q.map(ex=>ex.id === editingId ? entry : ex) : [...q,entry]);
  setEditingId(null);
  setExercise(''); setCustomName(''); setPreset(null); showToast(`${name} added — ${sets} sets × ${work}s`);
 }
 function removeFromQueue(index: number) { setQueue(q => q.filter((_,i)=>i!==index)); setPreset(null); showToast(`Removed: ${queue[index].name}`); }
 function clearQueue() { setEditingId(null); setQueue([]); setPreset(null); showToast('Queue cleared'); }
 function applyPreset(level: Preset) {
  if(preset === level) { clearQueue(); return; }
  setQueue(PRESETS[level].map(ex=>({...ex,id:crypto.randomUUID()}))); setPreset(level); showToast(`${level.charAt(0).toUpperCase()+level.slice(1)} preset loaded`);
 }
 function startWorkout() {
  if(!queue.length || editingId) return;
  skipped.current=false; transitioning.current=false;
  try { if(!audio.current || audio.current.state === 'closed') audio.current=new AudioContext(); void audio.current.resume(); } catch { /* Audio unavailable. */ }
  setExIdx(0); setSetIdx(0); setActive(true); setComplete(false); started.current=Date.now(); beginPhase(settings.preparation ? 'prepare' : 'work',settings.preparation || queue[0].work,queue[0].name); showToast(`Starting: ${queue[0].name}`);
 }
 function togglePause() {
  if(paused) deadline.current=performance.now()+savedRemaining.current*1000;
  else savedRemaining.current=Math.max(0,(deadline.current-performance.now())/1000);
  setPaused(!paused); showToast(paused ? 'Resumed' : 'Paused');
 }
 function returnToSetup() { if('speechSynthesis' in window) speechSynthesis.cancel(); setActive(false); setComplete(false); setPhase('idle'); setPaused(false); }
 function stopWorkout() { returnToSetup(); showToast('Workout stopped'); }
 function skipPhase() { if(phase !== 'prepare') skipped.current=true; showToast('Phase skipped'); advance(); }
 function editExercise(id: string) {
  const ex=queue.find(item=>item.id===id); if(!ex) return;
  setEditingId(id); setExercise('--- CUSTOM ---'); setCustomName(ex.name);
  for(const [key,field] of Object.entries({sets:'exSets',work:'exWork',shortRest:'exShortRest',longRest:'exLongRest'})) (document.getElementById(field) as HTMLInputElement).value=String(ex[key as keyof Exercise]);
  document.getElementById('exerciseSelect')?.scrollIntoView({behavior:'smooth',block:'center'});
 }
 function cancelEdit() { setEditingId(null); setExercise(''); setCustomName(''); }
 function moveExercise(index: number,direction: number) {
  if(index+direction < 0 || index+direction >= queue.length) return;
  setQueue(items => { const next=[...items]; [next[index],next[index+direction]]=[next[index+direction],next[index]]; return next; }); setPreset(null);
 }
 function saveRoutine() {
  const name=routineName.trim();
  if(!name || !queue.length) { showToast('Name your routine and add exercises first'); return; }
  if(routines.length >= 50) { showToast('Maximum 50 saved routines'); return; }
  setRoutines(items=>[...items,{id:crypto.randomUUID(),name:name.slice(0,80),exercises:queue.map(ex=>({...ex}))}]); setRoutineName(''); showToast('Routine saved');
 }
 function loadRoutine(id: string) { const r=routines.find(item=>item.id===id); if(r) { setQueue(r.exercises.map(ex=>({...ex,id:crypto.randomUUID()}))); setPreset(null); cancelEdit(); showToast('Routine loaded'); } }
 function deleteRoutine(id: string) { setRoutines(items=>items.filter(r=>r.id!==id)); showToast('Routine deleted'); }
 function exportRoutines() {
  const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,routines},null,2)],{type:'application/json'}));
  const link=document.createElement('a'); link.href=url; link.download='corepulse-routines.json'; link.click(); setTimeout(()=>URL.revokeObjectURL(url),1000);
 }
 async function importRoutines(file?: File) {
  if(!file) return;
  if(file.size > 1024*1024) { showToast('Choose a backup smaller than 1 MB'); return; }
  try { const imported=parseBackup(await file.text()); setRoutines(items=>[...items,...imported].slice(0,50)); showToast('Routines imported (up to 50 saved)'); } catch { showToast('This file is not a valid CorePulse routine backup'); }
 }
 async function toggleFullscreen() {
  try { if(document.fullscreenElement) await document.exitFullscreen(); else await document.documentElement.requestFullscreen(); } catch { showToast('Fullscreen is unavailable in this browser'); }
 }
 const nextAction = phase === 'prepare' ? 'Start '+(current?.name ?? '') : phase === 'short' ? 'Set '+(setIdx+1)+' · '+(current?.name ?? '') : phase === 'long' ? queue[exIdx+1]?.name : current && setIdx < current.sets-1 ? 'Short rest · '+current.shortRest+'s' : queue[exIdx+1] ? 'Long rest · '+current.longRest+'s' : 'Workout complete';
 const totalSets = queue.reduce((sum,ex)=>sum+ex.sets,0);
 const doneSets = queue.slice(0,exIdx).reduce((sum,ex)=>sum+ex.sets,0)+setIdx;
 const totalSeconds = queue.reduce((sum,ex,i)=>sum+ex.sets*ex.work+(ex.sets-1)*ex.shortRest+(i < queue.length-1 ? ex.longRest : 0),0);
 const phaseText = {idle:'GET READY',prepare:'GET READY',work:'WORKING',short:'SHORT REST',long:'LONG REST'}[phase];
 const badgeText = {idle:'IDLE',prepare:'READY',work:'WORKING',short:'RESTING',long:'LONG REST'}[phase];
 return {hadSkippedPhases:skipped.current,routines,history,settings,setSettings,storageError,editingId,routineName,setRoutineName,fullscreen,editExercise,cancelEdit,moveExercise,saveRoutine,loadRoutine,deleteRoutine,exportRoutines,importRoutines,toggleFullscreen,nextAction,queue,preset,exercise,setExercise,customName,setCustomName,phase,phaseText,badgeText,active,complete,paused,exIdx,setIdx,current,remaining,duration,progress:totalSets ? doneSets/totalSets*100 : 0,totalSeconds,totalSets,elapsed,toast,addExerciseToQueue,removeFromQueue,clearQueue,applyPreset,startWorkout,togglePause,skipPhase,stopWorkout,returnToSetup};
}
