# CorePulse

A workout timer built with React, TypeScript, Vite, and plain CSS.

## Development

Use Node.js 22.12 or newer.

```sh
npm install
npm run dev
```

Open the local address printed by Vite. Changes update automatically.
On Windows PowerShell, use `npm.cmd` if script execution policy blocks `npm`.

## Build

```sh
npm run build
npm run preview
```

The build checks TypeScript and creates the production site in `dist/`.

## Files

- `src/App.tsx`: React interface
- `src/useWorkout.ts`: typed workout state, timer, and audio
- `src/main.tsx`: React entry point
- `style.css`: existing responsive styles
- `public/`: logos and favicon

Use Vite instead of the VS Code Live Server extension for this project.

## Personal workouts

The queue, routines, preferences, and the last 100 finished sessions are stored in this browser using localStorage. They do not sync between devices. Use Export routines and Import backup to transfer saved routines. Storage failures are reported in the interface. Refresh restores setup, but does not resume an active timer.

Edit exercises from the queue, use the up/down buttons to reorder, and save the queue under a routine name. Preparation can be turned off or set to 3, 5, or 10 seconds. Timer sounds, voice cues, screen wake lock, and fullscreen depend on browser support. Sessions with skipped phases are marked in history.

The production build includes a web app manifest and an offline service worker. Serve `dist/` over HTTPS (or localhost), visit once online, then use the browser’s Install or Add to Home Screen menu. The development server does not register an offline worker. Google Fonts may fall back to system fonts offline. New builds activate after existing app tabs close.

## Checks

`npm test` checks storage validation, routine editing and backups, timer transitions, pause/resume, stopping, history, persistence, and React rendering with a simulated DOM. It does not replace testing device audio, fullscreen, wake lock, or installation in a real browser.

## Flexible workouts and coaching

- Build timed or repetition-based exercises. Repetition sets end only when you tap Done; their work duration is an estimate used by the preview and Fit my time.
- Give consecutive exercises a matching block name and style. Warm-up/cooldown organize the routine. Circuit/superset blocks repeat using the first exercise's round count (1–10). Sets run inside each round. Set rests to zero for immediate transitions.
- The preview shows work/rest totals and exercise order. Fit my time proposes reducing sets and then removing exercises from the end, preserving rest durations and rounds. Review and apply it to the current queue; saved routines are unchanged.
- During rest, +15s extends only the current rest. Manual Done completes a repetition set; Skip marks the session as including skipped phases. Undo restores the last removed/cleared queue or deleted routine.
- Choose Quiet, Essential, or Encouraging coaching. Quiet suppresses audio and vibration. Voice cues require Voice cues to be enabled. Device support and browser policies affect voice, vibration, fullscreen, and wake lock. Keep the workout tab visible for timely cues.
- Light/dark appearance, compact workout view, and reduced motion save with your settings. System reduced-motion preferences are also respected.
- Weekly activity uses local calendar days and the last 100 finished sessions. Session feedback and notes save automatically. Download a completion card as a PNG; it includes your note and marks skipped phases.
- Create a share link or QR from the current queue. Routine data lives in the URL fragment; recipients review before loading it. History and notes are excluded. Long routines may exceed QR capacity; use the share link or JSON backup instead.

`npm test` also checks repeated blocks, zero-rest transitions, manual sets, paused rest extensions, undo, fit-time changes, shared routine round trips, weekly totals, QR generation, card export, and compatibility with older saved data. Device features and visual layout still require real-browser testing.
