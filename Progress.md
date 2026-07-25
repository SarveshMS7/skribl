# Skribbl.io Clone — Project Progress

## How to use this file
- Mark tasks as done by changing `[ ]` to `[x]`
- This file is the source of truth for project progress
- When starting a new session, read this file first to know what's done and what's next

## Stack
- **Frontend:** React, Vite, TypeScript, Canvas API
- **Backend:** Node.js, TypeScript, Socket.IO, Express
- **State:** Redis
- **Infra:** Docker, docker-compose

---

## Phase 1 — Project Setup & Infrastructure
> Monorepo scaffold, Docker, Redis baseline

- [x] Initialise monorepo (pnpm workspaces or npm workspaces)
- [x] Scaffold React + Vite + TypeScript frontend (`apps/client`)
- [x] Scaffold Node.js + TypeScript backend (`apps/server`)
- [x] Set up shared types package (`packages/types`)
- [x] Configure ESLint + Prettier across workspaces
- [x] Write `docker-compose.yml` with Redis service
- [x] Write Dockerfile for backend (dev stage)
- [x] Write Dockerfile for frontend (dev stage)
- [x] Verify Redis connection from Node.js on startup
- [x] Set up environment variable loading (`.env` / dotenv)

**Status:** `DONE`

---

## Phase 2 — Backend: Rooms & Socket.IO
> Socket server, room creation/joining, Redis state, player sync

- [x] Install and configure Socket.IO server on Express/HTTP server
- [x] Define room data model (roomId, players, settings, status)
- [x] Implement `create-room` event — generate room code, persist to Redis
- [x] Implement `join-room` event — validate code, add player, broadcast update
- [x] Implement `leave-room` / disconnect cleanup
- [x] Store room state in Redis (JSON serialise/deserialise)
- [x] Emit `room-updated` event to all clients in room on any change
- [x] Implement `game-settings` event (rounds, draw time, custom words)
- [x] Implement host-transfer when host leaves
- [x] Player list sync — broadcast player join/leave to room

**Status:** `DONE`

---

## Phase 3 — Game Logic: Turns & Words
> State machine, word selection, turn timer, guess scoring

- [x] Define game state machine (waiting → choosing → drawing → scores → end)
- [x] Implement `start-game` event (host only, min players check)
- [x] Word bank — default word list on server
- [x] Word selection — pick 3 random words, send `word-choices` event to drawer
- [x] Implement `word-chosen` event — start turn timer
- [x] Server-side countdown timer for each turn
- [x] Broadcast `timer-tick` event every second to all clients
- [x] Implement guess validation (case-insensitive exact match)
- [x] Scoring — full points for early guess, decreasing over time
- [x] Emit `correct-guess` event (reveal to guesser, hide word from others)
- [x] Hint system — progressively reveal letters as timer ticks (optional)
- [x] Turn end — everyone guessed OR timer expired → show word, show scores
- [x] Advance to next player's turn in rotation
- [x] Round completion — all players drew → round complete
- [x] End-game trigger after all rounds complete
- [x] Emit `score-update` after every correct guess

**Status:** `DONE`

---

## Phase 4 — Frontend: UI & Real-time State
> Lobby UI, socket client, game state store, chat/guess UI

- [x] Set up Socket.IO client (singleton, connect on mount)
- [x] Home screen — create room / join room form
- [x] Lobby screen — player list, settings panel (host), start button
- [x] React context or Zustand store for game state
- [x] Handle all incoming socket events and update state
- [x] Word chooser modal — show 3 word options to drawer
- [x] Word display — blanks for non-drawers, actual word for drawer
- [x] Timer bar UI — animated countdown
- [x] Chat + guess input component
- [x] Chat message list — colour-coded for correct guesses vs chat
- [x] Player scoreboard sidebar — live score updates
- [x] Current drawer indicator
- [x] Round / turn counter display
- [x] Responsive layout (sidebar collapses on mobile — optional)

**Status:** `DONE`

---

## Phase 5 — Drawing Canvas
> Canvas tools, real-time draw sync, canvas reset on turn end

- [x] Canvas component with ref — full drawing area
- [ ] Tool state: pencil / eraser / fill bucket / colour picker / brush size
- [ ] Mouse event handlers — mousedown, mousemove, mouseup, mouseleave
- [ ] Touch event support for mobile drawing
- [x] Emit `draw-event` (path points, colour, size, tool) via socket
- [x] Receive and replay `draw-event`s on non-drawer canvases
- [ ] Throttle/batch draw events to avoid flooding socket
- [ ] Fill bucket tool — flood-fill algorithm on canvas pixel data
- [x] Canvas reset on turn start (clear all pixels)
- [x] Emit `canvas-clear` event when drawer clears / new turn starts
- [ ] Undo last stroke (Ctrl+Z) — optional polish
- [ ] Disable canvas interaction for non-drawers
- [ ] Colour palette UI + custom colour input
- [ ] Brush size slider

**Status:** `IN PROGRESS`

---

## Phase 6 — Polish & Deployment
> End-game screen, edge cases, production Docker build

- [ ] End-game screen — final leaderboard, winner highlight
- [ ] Play again flow — reset state, return to lobby
- [ ] Rejoin handling — player refreshes mid-game
- [ ] Room full / invalid code error messages
- [ ] Idle timeout — remove rooms with no players from Redis
- [ ] Rate-limit socket events (anti-spam on chat)
- [ ] Production Dockerfile for backend (multi-stage build)
- [ ] Production Dockerfile for frontend (Vite build → static serve)
- [ ] Update docker-compose for production
- [ ] Environment-based config (dev vs prod URLs)
- [ ] Basic smoke test — join, draw, guess, scores work end-to-end

**Status:** `NOT STARTED`

---

## Session Notes
<!-- Agents and humans: add dated notes here when resuming work -->

### 2026-07-23 (Session 2)
- Completed all remaining Phase 1 tasks.
- Fixed bugs: Redis key trailing space, wrong key prefix `rooms:` → `room:`, swapped args in `createRoom`/`joinRoom`/`handleguess`, wrong socket URL (`https://localhost:3000` → `http://localhost:3001`), host-transfer running after early return.
- Added dotenv to server; both server and client now use `.env` files.
- Created `server/Dockerfile` and `client/Dockerfile` (dev stage).
- Updated `docker-compose.yml` with server + client services.
- Created `packages/types` shared types package with typed Socket.IO event maps.
- Added `.prettierrc` root-level Prettier config.
- `tsc --noEmit` on server: 0 errors.
- Next: Phase 2 remaining (`game-settings` event) → Phase 4 frontend UI (Home + Lobby screens).

### 2026-07-24 (Session 3)
- Completed all remaining Phase 3 tasks (Game Logic: Turns & Words).
- **Word selection**: Added `pickThreeWords()` — sends 3 unique random words to the drawer via `wordChoices` event.
- **Word-chosen flow**: New `wordChosen` socket handler — drawer picks a word, turn timer starts. 15s auto-pick timeout if drawer doesn't choose.
- **Timer tick**: `setInterval` broadcasts `timerTick` with `secondsLeft` + `hint` every second to all clients.
- **Hint system**: `generateHint()` progressively reveals letters at 25/50/75% of elapsed time. Spaces/hyphens always visible.
- Added `choosing` status to game state machine (waiting → choosing → playing → Ended).
- Added `guessedPlayers` tracking to prevent duplicate scoring and enable all-guessed early turn end.
- Updated shared types with new socket events (`wordChoices`, `timerTick`, `scoreUpdate`, `wordChosen`).
- `tsc --noEmit` on server: 0 errors. `tsc -b --noEmit` on client: 0 errors.
- Next: Phase 4 frontend UI.

### 2026-07-25 (Session 4)
- Completed all Phase 4 tasks (Frontend: UI & Real-time State).
- **Design system**: Full CSS rewrite — dark theme, glassmorphism tokens, CSS custom properties, Google Fonts (Inter + Outfit), animation keyframes, utility classes.
- **Game store**: `useGameStore.tsx` — React Context + `useReducer` with typed actions for all game state transitions.
- **Socket events**: `useSocketEvents.ts` — custom hook subscribes to all 13 server→client events and dispatches to store.
- **Home screen**: Animated gradient title, create/join room forms, glassmorphism cards.
- **Lobby screen**: Room code with copy, player list with avatars, host settings (draw time/rounds/max players sliders), start game button.
- **Game screen**: 3-column layout (players | canvas | chat) with responsive breakpoints.
- **Game components**: WordChooser modal (3 cards), TimerBar (green→yellow→red), WordDisplay (hint/drawer/reveal), ChatBox (color-coded messages), PlayerList (sorted by score, drawer/guessed badges), RoundInfo.
- **End screen**: Podium display (top 3), full rankings, back-to-lobby flow.
- **SEO**: Updated index.html with title and meta description.
- `tsc --noEmit` on server: 0 errors. `tsc -b --noEmit` on client: 0 errors. `vite build`: success (68 modules, 20.8KB CSS, 253KB JS gzipped to 78KB).
- Next: Phase 5 drawing canvas tools.