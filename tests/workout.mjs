import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import React, { act } from 'react';
import { createRoot } from 'react-dom/client';
const dom = new JSDOM('<div id="root"></div><input id="exerciseName"><select id="exerciseSelect"></select><input id="exSets" value="2"><input id="exWork" value="5"><input id="exShortRest" value="5"><input id="exLongRest" value="10">',{url:'http://localhost',pretendToBeVisual:true});
for(const key of ['window','document','localStorage','HTMLElement','location','Event']) globalThis[key]=dom.window[key];
Object.defineProperty(globalThis,'navigator',{value:dom.window.navigator,configurable:true});
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
dom.window.HTMLElement.prototype.scrollIntoView=()=>{};
let now=0, nextFrame=0; const frames=new Map();
Object.defineProperty(performance,'now',{value:()=>now,configurable:true});
globalThis.requestAnimationFrame=callback=>{frames.set(++nextFrame,callback);return nextFrame;};
globalThis.cancelAnimationFrame=id=>frames.delete(id);
const server=await createServer({server:{middlewareMode:true},appType:'custom'});
const root=createRoot(document.getElementById('root'));
try {
 const storage=await server.ssrLoadModule('/src/storage.ts');
 assert.deepEqual(storage.readStored('missing',[],storage.validQueue),[]);
 localStorage.setItem('broken','{bad'); assert.deepEqual(storage.readStored('broken',[],storage.validQueue),[]);
 assert.throws(()=>storage.parseBackup('{"version":1,"routines":[{"name":"bad"}]}'));
 const {useWorkout}=await server.ssrLoadModule('/src/useWorkout.ts');
 let api;
 function Harness(){ api=useWorkout(); return null; }
 await act(async()=>root.render(React.createElement(Harness)));
 const change=async callback=>{await act(async()=>callback());};
 await change(()=>api.setExercise('Push-ups'));
 await change(()=>api.addExerciseToQueue());
 assert.equal(api.queue.length,1); assert.equal(api.queue[0].sets,2);
 assert.equal(JSON.parse(localStorage.getItem('corepulse.queue')).length,1);
 await change(()=>api.setExercise('Squats')); await change(()=>api.addExerciseToQueue());
 await change(()=>api.moveExercise(1,-1)); assert.equal(api.queue[0].name,'Squats');
 await change(()=>api.editExercise(api.queue[0].id)); assert.equal(api.customName,'Squats');
 document.getElementById('exSets').value='3';
 await change(()=>api.addExerciseToQueue()); assert.equal(api.queue.length,2); assert.equal(api.queue[0].sets,3);
 await change(()=>api.setRoutineName('Morning'));
 await change(()=>api.saveRoutine()); assert.equal(api.routines.length,1);
 const backup=JSON.stringify({version:1,routines:api.routines});
 const imported=storage.parseBackup(backup); assert.equal(imported[0].name,'Morning'); assert.notEqual(imported[0].id,api.routines[0].id);
 const invalid=JSON.parse(backup); invalid.routines[0].exercises[0].work=-5; assert.throws(()=>storage.parseBackup(JSON.stringify(invalid)));
 await change(()=>api.clearQueue()); await change(()=>api.loadRoutine(api.routines[0].id)); assert.equal(api.queue.length,2);
 await change(()=>api.setSettings({...api.settings,sound:false,preparation:3}));
 await change(()=>api.startWorkout()); assert.equal(api.phase,'prepare'); assert.equal(api.remaining,3);
 async function advance(ms) {now+=ms; const pending=[...frames.values()];frames.clear();await act(async()=>pending.forEach(cb=>cb(now)));}
 await advance(3001);assert.equal(api.phase,'work'); assert.equal(api.remaining,5);
 await advance(1000); await change(()=>api.togglePause());const frozen=api.remaining;
 await advance(10000); assert.equal(api.remaining,frozen);
 await change(()=>api.togglePause()); await advance(4001); assert.equal(api.phase,'short');
 await change(()=>api.stopWorkout()); assert.equal(api.active,false); await advance(10000);assert.equal(api.phase,'idle'); assert.equal(api.history.length,0);
 await change(()=>api.startWorkout()); await change(()=>api.skipPhase());
 for(let i=0; i<20 && api.active; i++) await change(()=>api.skipPhase());
 assert.equal(api.complete,true); assert.equal(api.history.length,1);assert.equal(api.history[0].skipped,true);
 assert.equal(JSON.parse(localStorage.getItem('corepulse.history')).length,1);
 await change(()=>api.returnToSetup());
 // Remount reads the persisted queue, routines, settings, and history.
 await act(async()=>root.render(null)); await act(async()=>root.render(React.createElement(Harness)));
 assert.equal(api.queue.length,2);assert.equal(api.routines.length,1);assert.equal(api.history.length,1);assert.equal(api.settings.preparation,3);
 // A naturally completed session is recorded without a skipped marker.
 await change(()=>api.clearQueue());
 document.getElementById('exSets').value='1';
 await change(()=>api.setExercise('Plank')); await change(()=>api.addExerciseToQueue());
 await change(()=>api.setSettings({...api.settings,preparation:0}));
 await change(()=>api.startWorkout()); await advance(5001);
 assert.equal(api.complete,true); assert.equal(api.history.length,2); assert.equal(api.history[0].skipped,false);
 await change(()=>api.returnToSetup());

 // Backward-compatible defaults and pure schedule calculations.
 const model=await server.ssrLoadModule('/src/workoutModel.ts');
 assert(storage.validSettings({sound:true,voice:false,preparation:5,keepAwake:true}));
 const base={id:'a',name:'Push-ups',sets:2,work:5,shortRest:5,longRest:10};
 const circuit=[{...base,block:'A',blockType:'circuit',rounds:2},{...base,id:'b',name:'Squats',sets:1,block:'A',blockType:'circuit',rounds:2}];
 const schedule=model.buildPlan(circuit);
 assert.deepEqual(schedule.filter(p=>p.phase==='work').map(p=>p.exIdx),[0,0,1,0,0,1]);
 assert.equal(model.estimate(circuit),schedule.reduce((sum,p)=>sum+p.seconds,0));
 const fitted=model.fitToTime(circuit,50);assert(model.estimate(fitted)<=50);assert.equal(circuit[0].sets,2);
 assert(fitted.every(ex=>ex.shortRest===5&&ex.longRest===10&&ex.rounds===2));
 const unicodeLink=model.sharedLink('????',circuit);
 const shared=storage.parseBackup(model.decodeShare(new URL(unicodeLink).hash));assert.equal(shared[0].name,'????');assert.equal(shared[0].exercises[0].rounds,2);
 assert.throws(()=>storage.parseBackup(model.decodeShare('#routine=bad')));
 const weekly=model.weeklyActivity([{id:'s',date:new Date(2026,9,19,12).toISOString(),exercises:1,sets:1,seconds:90,skipped:false}],new Date(2026,9,25,12));
 assert.equal(weekly[0].date.getDay(),1);assert.equal(weekly[0].count,1);assert.equal(weekly.reduce((n,d)=>n+d.seconds,0),90);
 // Destructive queue edits and routine deletion can be undone.
 await change(()=>api.clearQueue());assert.equal(api.queue.length,0);await change(()=>api.undo());assert.equal(api.queue.length,1);
 await change(()=>api.deleteRoutine(api.routines[0].id));assert.equal(api.routines.length,0);await change(()=>api.undo());assert.equal(api.routines.length,1);
 // Rest extensions survive pause/resume and do not change saved routines.
 await change(()=>api.applyFit([{...base}]));await change(()=>api.startWorkout());await advance(5001);assert.equal(api.phase,'short');
 await change(()=>api.togglePause());await change(()=>api.extendRest());assert.equal(api.remaining,20);assert.equal(api.queue[0].shortRest,5);
 await advance(50000);assert.equal(api.remaining,20);await change(()=>api.togglePause());await advance(19000);assert.equal(api.phase,'short');await advance(1001);assert.equal(api.phase,'work');
 await change(()=>api.stopWorkout());
 // Manual repetition sets never finish automatically, and Done is not a skip.
 await change(()=>api.applyFit([{...base,sets:1,mode:'reps',reps:12,shortRest:0,longRest:0}]));
 await change(()=>api.startWorkout());assert.equal(api.manual,true);await advance(99999);assert.equal(api.active,true);
 await change(()=>api.togglePause());await change(()=>api.doneReps());assert.equal(api.active,true);await change(()=>api.togglePause());await change(()=>api.doneReps());
 assert.equal(api.complete,true);assert.equal(api.history[0].skipped,false);
 await change(()=>api.updateFeedback('Just right','Strong session'));assert.equal(api.session.note,'Strong session');assert.equal(api.session.feedback,'Just right');const completedSnapshot=api;
 await change(()=>api.returnToSetup());
 // Run a complete two-round block, including zero-rest transitions.
 await change(()=>api.applyFit(circuit.map(ex=>({...ex,shortRest:0,longRest:0,sets:1}))));await change(()=>api.startWorkout());
 const order=[];while(api.active && order.length<10){order.push(api.current.name);await advance(5001);}
 assert.deepEqual(order,['Push-ups','Squats','Push-ups','Squats']);assert.equal(api.history[0].sets,4);
 await change(()=>api.returnToSetup());
 await change(()=>api.setSettings({...api.settings,theme:'light',reducedMotion:true,compact:true}));assert.equal(document.documentElement.dataset.theme,'light');assert(document.documentElement.classList.contains('reduce-motion'));
 // A shared URL asks to load a routine, then supports undo.
 window.history.replaceState(null,'',new URL(unicodeLink).hash);
 await act(async()=>root.render(null));await act(async()=>root.render(React.createElement(Harness)));
 assert.equal(api.sharedRoutine.name,shared[0].name);const previousQueue=api.queue;
 await change(()=>api.acceptShare());assert.equal(api.queue[0].rounds,2);assert.equal(window.location.hash,'');await change(()=>api.undo());assert.deepEqual(api.queue,previousQueue);
 await change(()=>api.loadRoutine(api.routines[0].id));
 // QR generation and completion-card export stay local.
 const qr=(await import('qrcode')).default;assert.match(await qr.toDataURL(unicodeLink),/^data:image\/png;base64,/);
 await act(async()=>root.render(null));
 const drawn=[];let downloaded=false;
 dom.window.HTMLCanvasElement.prototype.getContext=()=>({fillRect(){},fillText(text){drawn.push(text);},measureText(text){return {width:text.length*12};}});
 dom.window.HTMLCanvasElement.prototype.toDataURL=()=> 'data:image/png;base64,test';
 dom.window.HTMLAnchorElement.prototype.click=()=>{downloaded=true;};
 const {CompletionExtras}=await server.ssrLoadModule('/src/WorkoutFeatures.tsx');
 await act(async()=>root.render(React.createElement(CompletionExtras,{w:completedSnapshot})));
 await act(async()=>[...document.querySelectorAll('button')].find(b=>b.textContent==='Download completion card').click());
 assert(downloaded);assert(drawn.includes('All planned sets completed'));assert(drawn.includes('Strong session'));
 await act(async()=>root.render(null));
 const App=(await server.ssrLoadModule('/src/App.tsx')).default;
 await act(async()=>root.render(React.createElement(App)));
 assert.match(document.body.textContent,/Your routines/);assert.match(document.body.textContent,/Morning/);assert.match(document.body.textContent,/Workout settings/);
 assert.equal(document.querySelectorAll('.queue-actions').length,2);
 assert.match(document.body.textContent,/Workout preview/);assert.match(document.body.textContent,/Fit my time/);assert.match(document.body.textContent,/Coaching style/);assert.match(document.body.textContent,/Your weekly activity/);
 const increase=document.querySelector('[aria-label="Increase Sets"]');const number= increase.parentElement.querySelector('input');const before=Number(number.value);await act(async()=>increase.click());assert.equal(Number(number.value),before+1);
 console.log('Passed extended feature checks and: storage recovery, validation, editing, reordering, routines, backup validation, countdown, pause/resume, stop, history, persistence, and React rendering.');
} finally {await act(async()=>root.unmount());await server.close();dom.window.close();}
