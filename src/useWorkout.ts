import { buildPlan, estimate, decodeShare } from './workoutModel';
﻿import { useEffect, useMemo, useRef, useState } from 'react';

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
 const [queue,setQueue]=useState<Exercise[]>(()=>readStored('corepulse.queue',[],validQueue));
 const [routines,setRoutines]=useState<Routine[]>(()=>readStored('corepulse.routines',[],validRoutines));
 const [history,setHistory]=useState<Session[]>(()=>readStored('corepulse.history',[],validHistory));
 const [settings,setSettings]=useState<Settings>(()=>({...defaults,...readStored('corepulse.settings',defaults,validSettings)}));
 const [preset,setPreset]=useState<Preset|null>(null), [exercise,setExercise]=useState(''), [customName,setCustomName]=useState('');
 const [editingId,setEditingId]=useState<string|null>(null), [routineName,setRoutineName]=useState(''), [workoutName,setWorkoutName]=useState(()=>readStored('corepulse.workoutName','Custom workout',(v):v is string=>typeof v==='string'&&v.length<=80));
 const [storageError,setStorageError]=useState(false), [fullscreen,setFullscreen]=useState(false);
 const [active,setActive]=useState(false), [complete,setComplete]=useState(false), [paused,setPaused]=useState(false), [preparing,setPreparing]=useState(false);
 const [phaseIndex,setPhaseIndex]=useState(0), [remaining,setRemaining]=useState(0), [duration,setDuration]=useState(0), [elapsed,setElapsed]=useState(0);
 const [toast,setToast]=useState(''), [undoQueue,setUndoQueue]=useState<Exercise[]|null>(null), [undoRoutines,setUndoRoutines]=useState<Routine[]|null>(null);
 const [mode,setMode]=useState<'timed'|'reps'>('timed'), [block,setBlock]=useState(''), [blockType,setBlockType]=useState<NonNullable<Exercise['blockType']>>('standard');
 const [rounds,setRounds]=useState(1), [reps,setReps]=useState(10), [sessionId,setSessionId]=useState<string|null>(null);
 const [sharedRoutine,setSharedRoutine]=useState<Routine|null>(null);
 const deadline=useRef(0), savedRemaining=useRef(0), started=useRef(0), lastTick=useRef(-1), skipped=useRef(false), completedSets=useRef(0), finished=useRef(false);
 const audio=useRef<AudioContext|null>(null), toastTimer=useRef<ReturnType<typeof setTimeout>|undefined>(undefined);
 const settingsRef=useRef(settings);settingsRef.current=settings;
 const plan=useMemo(()=>buildPlan(queue),[queue]);const step=plan[phaseIndex];
 const phase: Phase=active ? preparing?'prepare':step?.phase??'idle' : 'idle';
 const exIdx=step?.exIdx??0, setIdx=step?.setIdx??0, current=queue[exIdx];
 const manual=active && !preparing && !!step?.manual;
 const totalSets=plan.filter(p=>p.phase==='work').length, totalSeconds=estimate(queue);
 const doneSets=plan.slice(0,phaseIndex).filter(p=>p.phase==='work').length;
 const progress=totalSets?doneSets/totalSets*100:0;
 function showToast(message:string) {setToast(message);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),3200);}
 useEffect(()=>()=>{clearTimeout(toastTimer.current);void audio.current?.close();if('speechSynthesis' in window) speechSynthesis.cancel();},[]);
 useEffect(()=>{try {
  for(const [key,value] of Object.entries({queue,routines,history,settings,workoutName})) localStorage.setItem('corepulse.'+key,JSON.stringify(value));setStorageError(false);
 } catch {setStorageError(true);}},[queue,routines,history,settings,workoutName]);
 useEffect(()=>{
  document.documentElement.dataset.theme=settings.theme??'dark';document.documentElement.classList.toggle('reduce-motion',!!settings.reducedMotion);
 },[settings.theme,settings.reducedMotion]);
 useEffect(()=>{if(phase!=='idle')document.body.classList.add('phase-'+phase);return ()=>document.body.classList.remove('phase-'+phase);},[phase]);
 useEffect(()=>{if(exercise==='--- CUSTOM ---')document.getElementById('exerciseName')?.focus();else setCustomName('');},[exercise]);
 useEffect(()=>{const change=()=>setFullscreen(!!document.fullscreenElement);document.addEventListener('fullscreenchange',change);return ()=>document.removeEventListener('fullscreenchange',change);},[]);
 useEffect(()=>{
  if(!active || !settings.keepAwake || !('wakeLock' in navigator))return;
  let cancelled=false;let lock:WakeLockSentinel|undefined;
  const request=async()=>{if(document.visibilityState!=='visible'||lock&&!lock.released)return;try{const next=await navigator.wakeLock.request('screen');if(cancelled)await next.release();else lock=next;}catch{/* Device may decline. */}};
  void request();document.addEventListener('visibilitychange',request);return ()=>{cancelled=true;void lock?.release();document.removeEventListener('visibilitychange',request);};
 },[active,settings.keepAwake]);
 useEffect(()=>{
  if(!location.hash.startsWith('#routine=')) return;
  try {const shared=parseBackup(decodeShare(location.hash));if(shared.length!==1)throw Error();setSharedRoutine(shared[0]);}catch{showToast('This shared routine link is invalid or too large');}
 },[]);
 function dismissShare(){setSharedRoutine(null);window.history.replaceState(null,'',location.pathname+location.search);}
 function acceptShare(){if(!sharedRoutine)return;setUndoQueue(queue);setQueue(sharedRoutine.exercises);setWorkoutName(sharedRoutine.name);setPreset(null);cancelEdit();dismissShare();showToast('Shared routine loaded. Save it to keep a named copy.');}
 function cue(text:string){const s=settingsRef.current;if(s.voice&&s.coaching!=='quiet'&&'speechSynthesis' in window){speechSynthesis.cancel();speechSynthesis.speak(new SpeechSynthesisUtterance(text));}}
 function vibrate(){try{if(settingsRef.current.vibration&&settingsRef.current.coaching!=='quiet'&&'vibrate' in navigator)navigator.vibrate([100,60,100]);}catch{/* Optional device vibration. */}}
 function sound(freq=880,length=.15,type:OscillatorType='square',gain=.35){if(!settingsRef.current.sound||settingsRef.current.coaching==='quiet')return;try{const ctx=audio.current;if(!ctx)return;const osc=ctx.createOscillator(),vol=ctx.createGain();osc.connect(vol);vol.connect(ctx.destination);osc.frequency.value=freq;osc.type=type;vol.gain.setValueAtTime(gain,ctx.currentTime);vol.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+length);osc.start();osc.stop(ctx.currentTime+length);}catch{/* Optional audio. */}}
 function enter(index:number,prepare=false){
  const target=plan[index];if(!target)return;
  setPhaseIndex(index);setPreparing(prepare);setPaused(false);
  const seconds=prepare?settings.preparation:target.seconds;setDuration(seconds);setRemaining(seconds);savedRemaining.current=seconds;deadline.current=performance.now()+seconds*1000;lastTick.current=-1;
  const ex=queue[target.exIdx],next=plan[index+1];
  const encouragement=!prepare && plan[index-1]?.phase==='work' && settingsRef.current.coaching==='encouraging' && plan.slice(0,index).filter(p=>p.phase==='work').length===Math.ceil(totalSets/2) ? 'Halfway through your sets. Keep going! ' : '';
  cue(encouragement+(prepare?'Get ready. '+ex.name:target.phase==='work'?`${ex.name}. Set ${target.setIdx+1} of ${ex.sets}.${target.rounds>1?' Round '+target.round+' of '+target.rounds+'.':''} ${target.manual?ex.reps+' repetitions. Tap Done when finished.':target.seconds+' seconds.'}`:`${target.phase==='short'?'Short':'Long'} rest. ${target.seconds} seconds. Next: ${next?queue[next.exIdx].name+', set '+(next.setIdx+1):'workout complete'}.`));
 }
 function finishWorkout(){
  if(finished.current)return;finished.current=true;
  const seconds=Math.max(0,Math.round((Date.now()-started.current)/1000)),id=crypto.randomUUID();
  setSessionId(id);setElapsed(seconds);setActive(false);setComplete(true);setPaused(false);setPreparing(false);
  setHistory(items=>[{id,date:new Date().toISOString(),exercises:queue.length,sets:totalSets,seconds,skipped:skipped.current,name:workoutName.trim()||'Custom workout'},...items].slice(0,100));
  cue('Workout complete. Well done!');sound(1047,.5,'triangle');vibrate();
 }
 function advance(markSkipped=false){
  if(!active||finished.current)return;
  if(preparing){started.current=Date.now();enter(0);return;}
  if(markSkipped)skipped.current=true;
  if(step?.phase==='work'&&!markSkipped)completedSets.current++;
  sound(880,.15);vibrate();
  if(phaseIndex>=plan.length-1){finishWorkout();return;}
  enter(phaseIndex+1);
  if(settingsRef.current.coaching==='encouraging'&&step?.phase==='work'&&doneSets+1===Math.ceil(totalSets/2)) showToast('Halfway through your sets. Keep going!');
 }
 useEffect(()=>{
  if(!active||paused||manual)return;
  let frame:number;
  const tick=()=>{const left=Math.max(0,(deadline.current-performance.now())/1000);savedRemaining.current=left;setRemaining(Math.ceil(left));const second=Math.ceil(left);if(second>0&&second<=3&&second!==lastTick.current){lastTick.current=second;sound(1100,.07,'square',.2);}if(left<=0){advance();return;}frame=requestAnimationFrame(tick);};
  frame=requestAnimationFrame(tick);return ()=>cancelAnimationFrame(frame);
 },[active,paused,manual,preparing,phaseIndex]);
 function startWorkout(){if(!queue.length||editingId)return;skipped.current=false;completedSets.current=0;finished.current=false;try{if(!audio.current||audio.current.state==='closed')audio.current=new AudioContext();void audio.current.resume();}catch{/* Optional audio. */}setActive(true);setComplete(false);setSessionId(null);started.current=Date.now();enter(0,!!settings.preparation);showToast('Starting: '+queue[0].name);}
 function togglePause(){if(!active)return;if(!manual){if(paused)deadline.current=performance.now()+savedRemaining.current*1000;else savedRemaining.current=Math.max(0,(deadline.current-performance.now())/1000);}if('speechSynthesis' in window)speechSynthesis.cancel();setPaused(!paused);showToast(paused?'Resumed':'Paused');}
 function returnToSetup(){setActive(false);setComplete(false);setPaused(false);setPreparing(false);if('speechSynthesis' in window)speechSynthesis.cancel();}
 function stopWorkout(){returnToSetup();showToast('Workout stopped');}
 function skipPhase(){showToast('Phase skipped');advance(!preparing);}
 function doneReps(){if(manual&&!paused)advance();}
 function extendRest(){if(phase!=='short'&&phase!=='long')return;deadline.current+=15000;savedRemaining.current+=15;setRemaining(Math.ceil(savedRemaining.current));setDuration(d=>d+15);showToast('Added 15 seconds of rest');}
 function addExerciseToQueue(){
  const name=exercise==='--- CUSTOM ---'?customName.trim():exercise;if(!name){showToast('Select or type an exercise');return;}
  const value=(id:string)=>Number((document.getElementById(id) as HTMLInputElement).value);
  const sets=value('exSets'),work=value('exWork'),shortRest=value('exShortRest'),longRest=value('exLongRest');
  const entry:Exercise={id:editingId??crypto.randomUUID(),name,sets,work,shortRest,longRest,mode,reps,block:block.trim(),blockType,rounds};
  if(!validQueue([entry])){showToast('Check the field limits, exercise name, repetitions, and rounds');return;}
  if(!editingId&&queue.length>=100){showToast('Maximum 100 exercises');return;}
  setUndoQueue(null);setQueue(items=>editingId?items.map(ex=>ex.id===editingId?entry:ex):[...items,entry]);setPreset(null);setEditingId(null);setExercise('');setCustomName('');showToast(editingId?'Exercise updated':'Exercise added');
 }
 function cancelEdit(){setEditingId(null);setExercise('');setCustomName('');}
 function editExercise(id:string){const ex=queue.find(item=>item.id===id);if(!ex)return;setEditingId(id);setExercise('--- CUSTOM ---');setCustomName(ex.name);setMode(ex.mode??'timed');setReps(ex.reps??10);setBlock(ex.block??'');setBlockType(ex.blockType??'standard');setRounds(ex.rounds??1);for(const [key,field] of Object.entries({sets:'exSets',work:'exWork',shortRest:'exShortRest',longRest:'exLongRest'}))(document.getElementById(field) as HTMLInputElement).value=String(ex[key as keyof Exercise]);document.getElementById('exerciseSelect')?.scrollIntoView({behavior:settings.reducedMotion?'instant':'smooth',block:'center'});}
 function rememberQueue(){setUndoQueue(queue);setUndoRoutines(null);}
 function removeFromQueue(index:number){rememberQueue();setQueue(items=>items.filter((_,i)=>i!==index));setPreset(null);showToast('Exercise removed');}
 function clearQueue(){rememberQueue();setQueue([]);cancelEdit();setPreset(null);showToast('Queue cleared');}
 function undo(){if(undoQueue){setQueue(undoQueue);setUndoQueue(null);cancelEdit();setPreset(null);}if(undoRoutines){setRoutines(undoRoutines);setUndoRoutines(null);}showToast('Change undone');}
 function moveExercise(index:number,direction:number){if(index+direction<0||index+direction>=queue.length)return;setUndoQueue(null);setQueue(items=>{const next=[...items];[next[index],next[index+direction]]=[next[index+direction],next[index]];return next;});setPreset(null);}
 function applyPreset(level:Preset){if(preset===level){clearQueue();return;}rememberQueue();setQueue(PRESETS[level].map(ex=>({...ex,id:crypto.randomUUID()})));setPreset(level);setWorkoutName(level.charAt(0).toUpperCase()+level.slice(1)+' workout');cancelEdit();showToast('Preset loaded');}
 function applyFit(exercises:Exercise[]){if(!validQueue(exercises)||!exercises.length)return;rememberQueue();setQueue(exercises);setPreset(null);cancelEdit();showToast('Adjusted queue applied. Saved routine unchanged.');}
 function saveRoutine(){const name=routineName.trim();if(!name||!queue.length){showToast('Name your routine and add exercises first');return;}if(routines.length>=50){showToast('Maximum 50 saved routines');return;}setRoutines(items=>[...items,{id:crypto.randomUUID(),name:name.slice(0,80),exercises:queue.map(ex=>({...ex}))}]);setWorkoutName(name.slice(0,80));setRoutineName('');showToast('Routine saved');}
 function loadRoutine(id:string){const r=routines.find(item=>item.id===id);if(r){rememberQueue();setQueue(r.exercises.map(ex=>({...ex,id:crypto.randomUUID()})));setWorkoutName(r.name);setPreset(null);cancelEdit();showToast('Routine loaded');}}
 function deleteRoutine(id:string){setUndoQueue(null);setUndoRoutines(routines);setRoutines(items=>items.filter(r=>r.id!==id));showToast('Routine deleted');}
 function exportRoutines(){const url=URL.createObjectURL(new Blob([JSON.stringify({version:1,routines},null,2)],{type:'application/json'}));const link=document.createElement('a');link.href=url;link.download='corepulse-routines.json';link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
 async function importRoutines(file?:File){if(!file)return;if(file.size>1024*1024){showToast('Choose a backup smaller than 1 MB');return;}try{const imported=parseBackup(await file.text());setRoutines(items=>[...items,...imported].slice(0,50));showToast('Routines imported (up to 50 saved)');}catch{showToast('Invalid CorePulse backup');}}
 async function toggleFullscreen(){try{if(document.fullscreenElement)await document.exitFullscreen();else await document.documentElement.requestFullscreen();}catch{showToast('Fullscreen unavailable');}}
 function updateFeedback(feedback:string,note:string){if(!sessionId)return;setHistory(items=>items.map(s=>s.id===sessionId?{...s,feedback:['Too easy','Just right','Too hard'].includes(feedback)?feedback:undefined,note:note.slice(0,280)}:s));}
 const following=plan[preparing?0:phaseIndex+1];
 const nextAction=following?`${queue[following.exIdx].name} · ${following.phase==='work'?'Set '+(following.setIdx+1)+(following.manual?' · '+queue[following.exIdx].reps+' reps':' · '+following.seconds+'s'):following.phase==='short'?'Short rest · '+following.seconds+'s':'Long rest · '+following.seconds+'s'}`:'Workout complete';
 const phaseText={idle:'GET READY',prepare:'GET READY',work:'WORKING',short:'SHORT REST',long:'LONG REST'}[phase];
 const badgeText={idle:'IDLE',prepare:'READY',work:'WORKING',short:'RESTING',long:'LONG REST'}[phase];
 return {hadSkippedPhases:skipped.current,routines,history,settings,setSettings,storageError,editingId,routineName,setRoutineName,fullscreen,editExercise,cancelEdit,moveExercise,saveRoutine,loadRoutine,deleteRoutine,exportRoutines,importRoutines,toggleFullscreen,nextAction,queue,preset,exercise,setExercise,customName,setCustomName,phase,phaseText,badgeText,active,complete,paused,exIdx,setIdx,current,remaining,duration,progress,totalSeconds,totalSets,elapsed,toast,addExerciseToQueue,removeFromQueue,clearQueue,applyPreset,startWorkout,togglePause,skipPhase,stopWorkout,returnToSetup,plan,step,manual,doneReps,extendRest,undo,canUndo:!!undoQueue||!!undoRoutines,mode,setMode,reps,setReps,block,setBlock,blockType,setBlockType,rounds,setRounds,applyFit,workoutName,setWorkoutName,session:history.find(s=>s.id===sessionId),updateFeedback,sharedRoutine,dismissShare,acceptShare};
}
