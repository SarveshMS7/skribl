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
- [ ] Word selection — pick 3 random words, send `word-choices` event to drawer
- [ ] Implement `word-chosen` event — start turn timer
- [x] Server-side countdown timer for each turn
- [ ] Broadcast `timer-tick` event every second to all clients
- [x] Implement guess validation (case-insensitive exact match)
- [x] Scoring — full points for early guess, decreasing over time
- [x] Emit `correct-guess` event (reveal to guesser, hide word from others)
- [ ] Hint system — progressively reveal letters as timer ticks (optional)
- [x] Turn end — everyone guessed OR timer expired → show word, show scores
- [x] Advance to next player's turn in rotation
- [x] Round completion — all players drew → round complete
- [x] End-game trigger after all rounds complete
- [x] Emit `score-update` after every correct guess

**Status:** `IN PROGRESS`

---

## Phase 4 — Frontend: UI & Real-time State
> Lobby UI, socket client, game state store, chat/guess UI

- [x] Set up Socket.IO client (singleton, connect on mount)
- [ ] Home screen — create room / join room form
- [ ] Lobby screen — player list, settings panel (host), start button
- [x] React context or Zustand store for game state
- [ ] Handle all incoming socket events and update state
- [ ] Word chooser modal — show 3 word options to drawer
- [ ] Word display — blanks for non-drawers, actual word for drawer
- [ ] Timer bar UI — animated countdown
- [ ] Chat + guess input component
- [ ] Chat message list — colour-coded for correct guesses vs chat
- [ ] Player scoreboard sidebar — live score updates
- [ ] Current drawer indicator
- [ ] Round / turn counter display
- [ ] Responsive layout (sidebar collapses on mobile — optional)

**Status:** `IN PROGRESS`

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