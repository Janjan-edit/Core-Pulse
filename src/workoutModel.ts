import type { Exercise, Session } from './storage';
export interface WorkoutPhase { phase: 'work' | 'short' | 'long'; exIdx: number; setIdx: number; seconds: number; round: number; rounds: number; manual: boolean }
export function buildPlan(queue: Exercise[]): WorkoutPhase[] {
 const plan: WorkoutPhase[]=[];
 let start=0;
 while(start<queue.length) {
  const first=queue[start]; let end=start+1;
  if(first.block) while(end<queue.length && queue[end].block===first.block && queue[end].blockType===first.blockType) end++;
  const rounds=['circuit','superset'].includes(first.blockType ?? '') ? first.rounds ?? 1 : 1;
  for(let round=1;round<=rounds;round++) for(let i=start;i<end;i++) {
   const ex=queue[i];
   for(let set=0;set<ex.sets;set++) {
    plan.push({phase:'work',exIdx:i,setIdx:set,seconds:ex.work,round,rounds,manual:ex.mode==='reps'});
    if(set<ex.sets-1 && ex.shortRest>0) plan.push({phase:'short',exIdx:i,setIdx:set+1,seconds:ex.shortRest,round,rounds,manual:false});
   }
   if((i<queue.length-1 || round<rounds) && ex.longRest>0) plan.push({phase:'long',exIdx:i,setIdx:ex.sets,seconds:ex.longRest,round,rounds,manual:false});
  }
  start=end;
 }
 return plan;
}
export function estimate(queue: Exercise[]) {
 let total=0,start=0;
 while(start<queue.length){const first=queue[start];let end=start+1;if(first.block)while(end<queue.length&&queue[end].block===first.block&&queue[end].blockType===first.blockType)end++;
 const rounds=['circuit','superset'].includes(first.blockType??'')?first.rounds??1:1;
 for(let i=start;i<end;i++){const ex=queue[i];total+=rounds*(ex.sets*ex.work+(ex.sets-1)*ex.shortRest+ex.longRest);}
 if(end===queue.length)total-=queue[end-1].longRest;start=end;
 }return total;
}
export function fitToTime(queue: Exercise[],seconds: number): Exercise[] {
 if(!Number.isFinite(seconds) || seconds<5) return [];
 const result=queue.map(ex=>({...ex}));
 while(result.length && estimate(result)>seconds) {
  const index=result.map(ex=>ex.sets).lastIndexOf(Math.max(...result.map(ex=>ex.sets)));
  if(result[index].sets>1) result[index].sets--; else result.pop();
 }
 return result;
}
export function weeklyActivity(history: Session[],today=new Date()) {
 const start=new Date(today.getFullYear(),today.getMonth(),today.getDate()); start.setDate(start.getDate()-((start.getDay()+6)%7));
 return Array.from({length:7},(_,i)=>{const date=new Date(start);date.setDate(date.getDate()+i);const end=new Date(date);end.setDate(end.getDate()+1);const sessions=history.filter(s=>new Date(s.date)>=date && new Date(s.date)<end);return {date,label:date.toLocaleDateString(undefined,{weekday:'short'}),count:sessions.length,seconds:sessions.reduce((sum,s)=>sum+s.seconds,0)};});
}
export function sharedLink(name: string,queue: Exercise[]) {
 const data=JSON.stringify({version:1,routines:[{id:'shared',name:name.trim().slice(0,80)||'Shared workout',exercises:queue}]});
 const bytes=new TextEncoder().encode(data);const encoded=btoa(Array.from(bytes,b=>String.fromCharCode(b)).join(''));
 return location.origin+location.pathname+'#routine='+encodeURIComponent(encoded);
}
export function decodeShare(hash: string) {
 if(!hash.startsWith('#routine=') || hash.length>200000) throw Error('Invalid shared routine');
 const bytes=Uint8Array.from(atob(decodeURIComponent(hash.slice(9))),c=>c.charCodeAt(0));return new TextDecoder().decode(bytes);
}
