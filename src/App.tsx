import { BuilderExtras, Preview, Preferences, WeeklyProgress, CompletionExtras, ShareInvitation } from './WorkoutFeatures';
import NumberStepper from './NumberStepper';
import { useWorkout, fmt } from './useWorkout';
export default function App() {
 const w = useWorkout();
 const { hadSkippedPhases, routines, history, settings, setSettings, storageError, editingId, routineName, setRoutineName, fullscreen, editExercise, cancelEdit, moveExercise, saveRoutine, loadRoutine, deleteRoutine, exportRoutines, importRoutines, toggleFullscreen, nextAction, queue, preset, exercise, setExercise, customName, setCustomName, phase, phaseText, badgeText, active, complete, paused, exIdx, setIdx, current, remaining, duration, progress, totalSeconds, totalSets, elapsed, toast, addExerciseToQueue, removeFromQueue, clearQueue, applyPreset, startWorkout, togglePause, skipPhase, stopWorkout, returnToSetup } = w;
 return <>
 <ShareInvitation w={w}/>

  
  <div className="bg-orb bg-orb-1"></div>
  <div className="bg-orb bg-orb-2"></div>
  <div className="bg-orb bg-orb-3"></div>

  <div className="wrapper">

    
    <header>
      <div className="logo">
        <img src="cplogo1.png" alt="CorePulse" className="logo-icon" width="38" height="38" />
<span className="logo-text">Core<span className="logo-accent">Pulse</span></span>
      </div>
      <div className="header-right">
        <div className={`mode-badge ${phase}`} id="modeBadge">
          <span className="badge-dot"></span>
          <span className="badge-text">{badgeText}</span>
        </div>
      </div>
    </header>

    
    <div className="status-bar" id="statusBar" style={{display: active ? "flex" : "none"}}>
      <div className="status-left">
        <div className="status-phase-pill" id="statusPhase">{phaseText}</div>
        <div className="status-exercise" id="statusExerciseName">{current?.name}</div>
      </div>
      <div className="status-right">
        <span className="status-detail" id="statusSetDetail">{`Set ${Math.min(setIdx+1,current?.sets ?? 1)} of ${current?.sets ?? 1}`}</span>
        <span className="status-sep">·</span>
        <span className="status-detail" id="statusExerciseDetail">{`Exercise ${exIdx+1} of ${queue.length}`}</span>
      </div>
      <div className="status-progress-track">
        <div className="status-progress-fill" id="statusProgressFill" style={{width: `${progress}%`}}></div>
      </div>
    </div>

    
    {storageError && <p role="alert" className="storage-note">Browser storage is unavailable or full. Export your routines to keep a backup.</p>}
    <div id="setupPanel" style={{display: active ? "none" : "block"}}>

      
      <div className="section-header" style={{"marginTop":"32px"}}>
        <span className="section-label" id="presetLabel">{preset ? `${preset.toUpperCase()} PRESET` : "QUICK START"}</span>
        <div className="preset-chips">
          <button className={`preset-chip ${preset === "beginner" ? "active" : ""}`} disabled={!!editingId} data-preset="beginner"     onClick={() => applyPreset('beginner')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4l3 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Beginner
          </button>
          <button className={`preset-chip ${preset === "intermediate" ? "active" : ""}`} disabled={!!editingId} data-preset="intermediate" onClick={() => applyPreset('intermediate')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            Intermediate
          </button>
          <button className={`preset-chip ${preset === "advanced" ? "active" : ""}`} disabled={!!editingId} data-preset="advanced"     onClick={() => applyPreset('advanced')}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2" strokeLinejoin="round"/></svg>
            Advanced
          </button>
        </div>
      </div>

      
      <div className="section-label" style={{"marginTop":"28px","marginBottom":"12px"}}>BUILD YOUR WORKOUT</div>
      <div className="form-card">
        <div className="form-grid">

          <div className="form-group col-span-2">
            <label className="field-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" stroke="currentColor" strokeWidth="2"/></svg>
              Exercise
            </label>
            <div className="select-wrap">
              <select id="exerciseSelect" value={exercise} onChange={e => setExercise(e.target.value)}>
                <option value="">— Choose exercise —</option>
                <option>Push-ups</option>
                <option>Squats</option>
                <option>Plank</option>
                <option>Deadlift</option>
                <option>Bench Press</option>
                <option>Pull-ups</option>
                <option>Lunges</option>
                <option>Burpees</option>
                <option>Dumbbell Curl</option>
                <option>Shoulder Press</option>
                <option>Mountain Climbers</option>
                <option>Box Jumps</option>
                <option>Tricep Dips</option>
                <option>Jumping Jacks</option>
                <option>Kettlebell Swing</option>
                <option>--- CUSTOM ---</option>
              </select>
              <svg className="select-arrow" width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <input type="text" id="exerciseName" value={customName} onChange={e => setCustomName(e.target.value)} onKeyDown={e => { if(e.key === "Enter") addExerciseToQueue(); }} className="text-input" placeholder="Type custom exercise name..." style={{display: exercise === "--- CUSTOM ---" ? "block" : "none", marginTop: "8px"}} />
          </div>

          <div className="form-group">
            <label className="field-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M9 11l3 3L22 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Sets
            </label>
            <NumberStepper id="exSets" label="Sets" defaultValue={3} min={1} max={20} />
          </div>

          <div className="form-group">
            <label className="field-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 6v6l4 2" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {w.mode === "reps" ? "Estimated time per set (sec)" : "Work (sec)"}
            </label>
            <NumberStepper id="exWork" label="Work duration in seconds" defaultValue={45} min={5} max={3600} />
          </div>

          <div className="form-group">
            <label className="field-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M18 8h1a4 4 0 010 8h-1M2 8h16v9a4 4 0 01-4 4H6a4 4 0 01-4-4V8zM6 1v3M10 1v3M14 1v3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
              Short Rest (sec)
              <span className="field-hint">between sets</span>
            </label>
            <NumberStepper id="exShortRest" label="Short rest in seconds" defaultValue={30} min={0} max={600} />
          </div>

          <div className="form-group">
            <label className="field-label">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" stroke="currentColor" strokeWidth="2"/><path d="M12 8v4M12 16h.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              Long Rest (sec)
              <span className="field-hint">after exercise</span>
            </label>
            <NumberStepper id="exLongRest" label="Long rest in seconds" defaultValue={90} min={0} max={600} />
          </div>

          <div className="col-span-2"><BuilderExtras w={w}/></div>
          <div className="form-group col-span-2 form-group--add">
            <button className="btn-add" onClick={() => addExerciseToQueue()}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
              {editingId ? "Save Changes" : "Add to Queue"}
            </button>
          </div>

        </div>
      </div>

      
      {editingId && <button className="small-button" onClick={cancelEdit}>Cancel editing</button>}
      <div className="queue-header" id="queueHeader" style={{display: queue.length ? "flex" : "none"}}>
        <div className="queue-header-left">
          <span className="queue-count-badge" id="queueCount">{queue.length}</span>
          <span className="queue-header-label">exercises queued</span>
          <span className="queue-time-pill" id="queueTotalTime">~{Math.round(totalSeconds / 60)} min</span>
        </div>
        <button className="btn-clear" id="btnClearQueue" onClick={() => clearQueue()}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none"><path d="M3 6h18M19 6l-1 14a2 2 0 01-2 2H8a2 2 0 01-2-2L5 6M10 11v6M14 11v6M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          Clear All
        </button>
      </div>

      
      <div className="queue-empty" id="queueEmpty" style={{display: queue.length ? "none" : "flex"}}>
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none"><path d="M6.5 6.5h11M6.5 17.5h11M4 12h16M2 9.5h2M2 14.5h2M20 9.5h2M20 14.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        <p>No exercises yet</p>
        <span>Pick a preset or add exercises above to build your workout</span>
      </div>

      
      <div className="queue-scroll-wrap" id="queueScrollWrap" style={{display: queue.length ? "block" : "none"}}>
        <div className="queue-list" id="queueList">{queue.map((ex,i) => <div className="queue-item" key={ex.id}><div className="queue-num">{i+1}</div><div className="queue-info"><div className="queue-name">{ex.name}</div><div className="queue-tags"><span className="tag tag-sets">{ex.sets} sets</span><span className="tag tag-work">{ex.mode === "reps" ? `${ex.reps} reps` : `${ex.work}s work`}</span>{ex.block && <span className="tag tag-sets">{ex.block} ? {ex.blockType ?? "standard"}{["circuit","superset"].includes(ex.blockType??"") ? ` ? ${ex.rounds??1} rounds` : ""}</span>}<span className="tag tag-short">{ex.shortRest}s short</span><span className="tag tag-long">{ex.longRest}s long</span><span className="tag tag-time">~{fmt(ex.sets*ex.work+(ex.sets-1)*ex.shortRest)}</span></div></div><div className="queue-actions"><button className="small-button" onClick={() => editExercise(ex.id)} disabled={!!editingId}>Edit</button><button className="small-button" onClick={() => moveExercise(i,-1)} disabled={i===0 || !!editingId} aria-label={`Move ${ex.name} up`}>↑</button><button className="small-button" onClick={() => moveExercise(i,1)} disabled={i===queue.length-1 || !!editingId} aria-label={`Move ${ex.name} down`}>↓</button><button className="queue-remove" disabled={!!editingId} onClick={() => removeFromQueue(i)} title="Remove exercise" aria-label={`Remove ${ex.name}`}>×</button></div></div>)}</div>
      </div>

      
      {queue.length > 0 && <Preview w={w}/>}
      <button className="btn-start" id="btnStartWorkout" onClick={() => startWorkout()} disabled={!queue.length || !!editingId}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><polygon points="5,3 19,12 5,21" fill="currentColor"/></svg>
        Start Workout
      </button>

      <section className="feature-card" aria-labelledby="routinesTitle">
        <h2 id="routinesTitle">Your routines</h2>
        <p className="muted">Saved on this browser. Export a backup to take them with you.</p>
        <div className="inline-controls"><input className="text-input" aria-label="Routine name" placeholder="e.g. Morning strength" maxLength={80} value={routineName} onChange={e=>setRoutineName(e.target.value)}/><button className="small-button" disabled={!queue.length || !!editingId} onClick={saveRoutine}>Save queue</button></div>
        <div className="saved-list">{routines.length ? routines.map(r=><div className="saved-row" key={r.id}><div><strong>{r.name}</strong><span className="muted">{r.exercises.length} exercises</span></div><div className="inline-controls"><button className="small-button" onClick={()=>loadRoutine(r.id)} disabled={!!editingId}>Load</button><button className="small-button" onClick={()=>deleteRoutine(r.id)}>Delete</button></div></div>) : <p className="muted">Your first saved routine will appear here.</p>}</div>
        <div className="inline-controls"><button className="small-button" disabled={!routines.length} onClick={exportRoutines}>Export routines</button><label className="small-button file-button">Import backup<input type="file" accept="application/json,.json" onChange={e=>{void importRoutines(e.target.files?.[0]);e.target.value='';}}/></label></div>
      </section>
      <section className="feature-card" aria-labelledby="settingsTitle"><h2 id="settingsTitle">Workout settings</h2><p className="muted">Install CorePulse from your browser's app or Add to Home Screen menu. Offline use is available in the production app after the first visit.</p><div className="settings-grid">
        <label><input type="checkbox" checked={settings.sound} onChange={e=>setSettings({...settings,sound:e.target.checked})}/> Timer sounds</label>
        <label><input type="checkbox" checked={settings.voice} onChange={e=>setSettings({...settings,voice:e.target.checked})}/> Voice cues</label>
        <label><input type="checkbox" checked={settings.keepAwake} onChange={e=>setSettings({...settings,keepAwake:e.target.checked})}/> Keep screen awake when supported</label>
        <label className="countdown-setting" htmlFor="preparationCountdown">
          <span>Preparation countdown<span className="setting-hint">Time to get into position</span></span>
          <span className="select-wrap settings-select">
            <select id="preparationCountdown" value={settings.preparation} onChange={e=>setSettings({...settings,preparation:Number(e.target.value)})}>
              {[0,3,5,10].map(n=><option key={n} value={n}>{n ? n+' seconds' : 'Off'}</option>)}
            </select>
            <svg className="select-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </span>
        </label>
      </div><Preferences w={w}/></section>
      <WeeklyProgress w={w}/>
      <section className="feature-card" aria-labelledby="historyTitle"><h2 id="historyTitle">Recent workouts</h2><p className="muted">Last 100 finished sessions on this browser.</p>{history.length ? history.slice(0,10).map(session=><div className="saved-row" key={session.id}><div><strong>{new Date(session.date).toLocaleString()}</strong><span className="muted">{session.exercises} exercises · {session.sets} planned sets{session.skipped ? ' · Includes skipped phases' : ''}</span></div>{session.feedback&&<span className="tag tag-work">{session.feedback}</span>}{session.note&&<p className="session-note">{session.note}</p>}<span>{fmt(session.seconds)}</span></div>) : <p className="muted">Finish a workout to start your history.</p>}</section>
    </div>

    <div className={settings.compact ? "compact-workout" : ""} id="activePanel" style={{display: active ? "block" : "none"}}>

      
      <div className={`hero-card phase-${phase}`} id="heroCard">

        <button className="small-button fullscreen-button" onClick={()=>void toggleFullscreen()}>{fullscreen ? 'Exit fullscreen' : 'Fullscreen'}</button>
        <h1 className="active-exercise">{current?.name}</h1>
        <div className="hero-phase-label" id="heroPhaseLabel">{paused ? "PAUSED" : phaseText}{w.step && w.step.rounds>1 && <span> / Round {w.step.round}/{w.step.rounds}</span>}</div>

        <div className="hero-ring-wrap">
          <svg viewBox="0 0 220 220" className="hero-ring-svg">
            <circle className="ring-track" cx="110" cy="110" r="96"/>
            <circle className="ring-fill"  id="heroRing" cx="110" cy="110" r="96"
              strokeDasharray="603.19" strokeDashoffset={603.19 * (1 - (duration ? remaining/duration : 0))}/>
          </svg>
          <div className={`hero-timer ${paused ? "is-paused" : ""} ${w.manual ? "rep-display" : ""}`} id="heroDisplay">{paused ? "PAUSED" : w.manual ? `${current?.reps} reps` : fmt(remaining)}</div>
          <div className="hero-subtext" id="heroSubtext">{phase === "prepare" ? "GET INTO POSITION" : phase === "work" ? current?.name.toUpperCase() : phase === "short" ? "REST UP · NEXT SET SOON" : "GREAT WORK · NEXT EXERCISE SOON"}</div>
        </div>

        
        <p className="next-action">Next: {nextAction}</p>
        <div className="hero-controls">
          {w.manual && <button className="ctrl-btn ctrl-done" onClick={w.doneReps} disabled={paused}>Done ? next set</button>}
          {(phase === "short" || phase === "long") && <button className="ctrl-btn ctrl-skip" onClick={w.extendRest}>+15s rest</button>}
          <button className="small-button" onClick={()=>setSettings({...settings,compact:!settings.compact})}>{settings.compact ? "Show details" : "Compact view"}</button>
          <button className={`ctrl-btn ctrl-pause ${paused ? "paused" : ""}`} id="heroPauseBtn" onClick={() => togglePause()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" id="pauseIcon" style={{display: paused ? "none" : "block"}}><rect x="6" y="4" width="4" height="16" rx="1" fill="currentColor"/><rect x="14" y="4" width="4" height="16" rx="1" fill="currentColor"/></svg>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" id="resumeIcon" style={{display: paused ? "block" : "none"}}><polygon points="5,3 19,12 5,21" fill="currentColor"/></svg>
            <span id="pauseBtnText">{paused ? "Resume" : "Pause"}</span>
          </button>
          <button className="ctrl-btn ctrl-skip" onClick={() => skipPhase()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><polygon points="5,4 15,12 5,20" fill="currentColor"/><rect x="16" y="4" width="3" height="16" rx="1" fill="currentColor"/></svg>
            Skip
          </button>
          <button className="ctrl-btn ctrl-stop" onClick={() => stopWorkout()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><rect x="4" y="4" width="16" height="16" rx="2" fill="currentColor"/></svg>
            Stop
          </button>
        </div>

      </div>

      
      <div className="progress-row">

        <div className="progress-card">
          <div className="prog-label">Exercise</div>
          <div className="prog-fraction">
            <span className="prog-cur" id="exCurDisplay">{exIdx+1}</span>
            <span className="prog-sep">/</span>
            <span className="prog-tot" id="exTotDisplay">{queue.length}</span>
          </div>
          <div className="prog-name" id="exNameDisplay">{current?.name}</div>
          <div className="prog-bar-track">
            <div className="prog-bar-fill" id="exProgressFill" style={{width: `${queue.length ? exIdx/queue.length*100 : 0}%`}}></div>
          </div>
        </div>

        <div className="progress-card">
          <div className="prog-label">Sets</div>
          <div className="prog-fraction">
            <span className="prog-cur" id="setCurDisplay">{Math.min(setIdx+1,current?.sets ?? 1)}</span>
            <span className="prog-sep">/</span>
            <span className="prog-tot" id="setTotDisplay">{current?.sets}</span>
          </div>
          <div className="prog-name" id="setPhaseDisplay">{phaseText}</div>
          <div className="dot-grid" id="activeDotGrid">{Array.from({length: current?.sets ?? 0},(_,i) => <div key={i} className={`dot ${i < setIdx ? "done" : i === setIdx ? "current-dot" : ""}`}>{i+1}</div>)}</div>
        </div>

      </div>

      
      <div className="upcoming-section">
        <div className="section-label" style={{"marginBottom":"12px"}}>UP NEXT</div>
        <div className="upcoming-list" id="upcomingList">{queue.slice(exIdx).map((ex,i) => <div className={`upcoming-item ${i === 0 ? "next" : ""}`} key={ex.id}><div className="upcoming-num">{exIdx+i+1}</div><div className="upcoming-name">{ex.name}</div><div className="upcoming-meta">{i === 0 ? Math.max(0,ex.sets-setIdx) : ex.sets} sets · {ex.work}s work · {ex.shortRest}s rest</div></div>)}</div>
      </div>

    </div>

    <footer>
      <span>CorePulse</span>
      <span className="footer-dot">·</span>
      <span>Stay Consistent. Stay Strong.</span>
    </footer>

  </div>

  
  <div id="workout-complete" className={complete ? "show" : ""}>
    <div className="complete-inner">
      <div className="complete-icon">🏆</div>
      <div className="complete-title">Crushed It!</div>
      <div className="complete-sub" id="completeSubText">{hadSkippedPhases ? "Session finished - includes skipped phases" : "All planned sets completed!"}</div>
      <div className="complete-stats" id="completeStats"><strong>{queue.length}</strong> exercises · <strong>{totalSets}</strong> {hadSkippedPhases ? "planned sets" : "total sets"}<br/>Total time: <strong>{fmt(elapsed)}</strong></div>
      <CompletionExtras w={w}/>
      <button className="btn-again" onClick={() => returnToSetup()}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M1 4v6h6M23 20v-6h-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10M23 14l-4.64 4.36A9 9 0 013.51 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        New Workout
      </button>
    </div>
  </div>

  
  {w.canUndo && !active && !complete && <div className="undo-bar" role="status"><span>Recent change</span><button className="small-button" onClick={w.undo}>Undo</button></div>}
  <div id="toast" role="status" className={toast ? "show" : ""}>{toast}</div>

  </>;
}
