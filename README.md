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
