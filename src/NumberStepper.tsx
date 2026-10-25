import { useRef } from 'react';

interface NumberStepperProps {
 id: string;
 label: string;
 defaultValue: number;
 min: number;
 max: number;
}

export default function NumberStepper({ id, label, defaultValue, min, max }: NumberStepperProps) {
 const input = useRef<HTMLInputElement>(null);
 function adjust(direction: number) {
  const field = input.current;
  if (!field) return;
  const current = field.value === '' ? defaultValue : field.valueAsNumber;
  const next = Number.isFinite(current) ? Math.round(current) + direction : defaultValue;
  field.value = String(Math.min(max, Math.max(min, next)));
  field.dispatchEvent(new Event('input', { bubbles: true }));
 }
 return (
  <div className="number-stepper">
   <button type="button" className="stepper-button" aria-label={`Decrease ${label}`} aria-controls={id} onClick={() => adjust(-1)}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
   </button>
   <input ref={input} type="number" inputMode="numeric" id={id} aria-label={label} defaultValue={defaultValue} min={min} max={max} step={1} className="num-input" />
   <button type="button" className="stepper-button" aria-label={`Increase ${label}`} aria-controls={id} onClick={() => adjust(1)}>
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12h14M12 5v14" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
   </button>
  </div>
 );
}
