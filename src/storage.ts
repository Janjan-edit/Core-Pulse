export interface Exercise { id: string; name: string; sets: number; work: number; shortRest: number; longRest: number }
export interface Routine { id: string; name: string; exercises: Exercise[] }
export interface Session { id: string; date: string; exercises: number; sets: number; seconds: number; skipped: boolean }
export interface Settings { sound: boolean; voice: boolean; preparation: number; keepAwake: boolean }
export const defaults: Settings = {sound:true,voice:false,preparation:5,keepAwake:true};
export function validExercise(value: unknown): value is Exercise {
 if(!value || typeof value !== 'object') return false;
 const ex = value as Exercise;
 return typeof ex.id === 'string' && typeof ex.name === 'string' && ex.name.trim().length > 0 && ex.name.length <= 100 &&
  (['sets','work','shortRest','longRest'] as const).every((key,i) => Number.isInteger(ex[key]) && ex[key] >= [1,5,5,10][i] && ex[key] <= [20,3600,600,600][i]);
}
export function validQueue(value: unknown): value is Exercise[] { return Array.isArray(value) && value.length <= 100 && value.every(validExercise) && new Set(value.map(ex=>ex.id)).size === value.length; }
export function validRoutines(value: unknown): value is Routine[] {
 return Array.isArray(value) && value.length <= 50 && value.every(r=>r && typeof r.id === 'string' && typeof r.name === 'string' && r.name.trim().length > 0 && r.name.length <= 80 && validQueue(r.exercises) && r.exercises.length > 0);
}
export function validSettings(value: unknown): value is Settings {
 if(!value || typeof value !== 'object') return false;
 const s = value as Settings;
 return typeof s.sound === 'boolean' && typeof s.voice === 'boolean' && typeof s.keepAwake === 'boolean' && [0,3,5,10].includes(s.preparation);
}
export function validHistory(value: unknown): value is Session[] {
 return Array.isArray(value) && value.length <= 100 && value.every(s=>s && typeof s.id === 'string' && typeof s.date === 'string' && Number.isFinite(Date.parse(s.date)) && typeof s.skipped === 'boolean' && ['exercises','sets','seconds'].every(k=>Number.isInteger(s[k]) && s[k]>=0));
}
export function readStored<T>(key: string, fallback: T, valid: (v: unknown)=>v is T): T {
 try { const data: unknown = JSON.parse(localStorage.getItem(key) ?? 'null'); return valid(data) ? data : fallback; } catch { return fallback; }
}
export function parseBackup(text: string): Routine[] {
 const value: unknown = JSON.parse(text);
 if(!value || typeof value !== 'object' || !('version' in value) || value.version !== 1 || !('routines' in value) || !validRoutines(value.routines)) throw Error('Invalid CorePulse backup');
 return value.routines.map(r=>({...r,id:crypto.randomUUID(),exercises:r.exercises.map(ex=>({...ex,id:crypto.randomUUID()}))}));
}
