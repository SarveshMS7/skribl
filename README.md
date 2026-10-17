# 🎨 Skribl — Real-Time Multiplayer Drawing & Guessing Game

A full-stack, real-time multiplayer drawing and guessing game inspired by Skribbl.io. Built with **React**, **Vite**, **TypeScript**, **Node.js**, **Socket.IO**, and **Redis**.

---

## ✨ Features

- **Multiplayer Room System**:
  - Create private game rooms with unique room codes.
  - Join rooms with custom nicknames.
  - Host room controls: configure draw time, rounds, and max players.
  - Automatic host reassignment if the current host disconnects.
  - Mid-game session reconnection support.
- **Interactive Game Flow**:
  - **State Machine**: `waiting` (lobby) → `choosing` (word pick) → `playing` (drawing/guessing) → `Ended` (podium).
  - **Word Selection**: The active drawer chooses 1 of 3 random words (with a 15-second countdown / auto-pick fallback).
  - **Progressive Hint System**: Letter hints reveal at 25%, 50%, and 75% of the elapsed turn time.
  - **Scoring System**: Dynamic points based on speed (earlier correct guesses earn more points, drawer earns bonus points).
  - **Turn Rotation & End-Game**: Automatic turn switching, round management, and top-3 podium leaderboard.
- **HTML5 Canvas Drawing Suite**:
  - Synchronized real-time drawing with sub-millisecond socket broadcasts.
  - Multiple tools: **Pencil**, **Eraser**, and **Fill Bucket** (flood-fill algorithm).
  - Adjustable brush sizes and curated color palette.
  - Replay buffer so late rejoiners receive drawn strokes.
- **Real-Time Chat & Guessing**:
  - Integrated chat box that automatically distinguishes chat messages from guesses.
  - Color-coded notifications for correct guesses, system updates, and turn results.
  - Rate-limiting protection against chat and guess spam.
- **Modern UI & Aesthetic**:
  - Dark mode glassmorphism interface styled with vanilla CSS custom properties.
  - Smooth animations, Google Fonts (`Inter` and `Outfit`), and responsive layout.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 19, TypeScript, Vite, HTML5 Canvas API, Socket.IO Client |
| **Backend** | Node.js, Express 5, TypeScript, Socket.IO Server, ioredis |
| **Storage & State** | Redis 7 (room metadata, session persistence, game state) |
| **Monorepo** | npm workspaces (`client`, `server`, `packages/types`) |
| **Containers** | Docker, Docker Compose (Multi-stage builds, Nginx static serve) |

---

## 📁 Repository Structure

```text
skribl/
├── client/                     # Frontend React + Vite application
│   ├── src/
│   │   ├── app/                # Main game screens (Home, Lobby, Game, End)
│   │   ├── components/         # Canvas, Chat, WordChooser, PlayerList, etc.
│   │   ├── context/            # React state & store providers
│   │   ├── hooks/              # Custom socket event hooks
│   │   ├── services/           # Socket.IO client singleton
│   │   └── index.css           # Global design system & theme tokens
│   ├── Dockerfile              # Multi-stage production build (Vite -> Nginx)
│   └── package.json
├── server/                     # Backend Node.js + Express + Socket.IO server
│   ├── src/
│   │   ├── services/           # Room, game logic, word bank & scoring services
│   │   ├── redis.ts            # Redis connection client
│   │   ├── server.ts           # Socket.IO event handlers and HTTP server
│   │   └── types.ts            # Server-side data structures
│   ├── Dockerfile              # Multi-stage production build
│   └── package.json
├── packages/
│   └── types/                  # Shared TypeScript interfaces & socket event contracts
├── docker-compose.yml          # Container configuration for Redis, server, and client
├── Progress.md                 # Project development roadmap & changelog
└── package.json                # Monorepo root configuration
```

---

## 🚀 Getting Started

### Prerequisites

Ensure you have the following installed on your machine:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker](https://www.docker.com/) & Docker Compose (for running Redis or full containerized app)

---

### Method 1: Local Development (Recommended)

1. **Clone the repository and install dependencies:**
   ```bash
   git clone https://github.com/SarveshMS7/skribl.git
   cd skribl
   npm install
   ```

2. **Start the Redis container:**
   ```bash
   docker compose up -d redis
   ```
   > Redis will be accessible on `localhost:6379`.

3. **Start the backend server:**
   ```bash
   npm run dev --workspace=server
   ```
   > Server will start on `http://localhost:3001`.

4. **Start the frontend client:**
   ```bash
   npm run dev --workspace=client
   ```
   > Client will start on `http://localhost:5173`.

5. **Open the game:**
   Navigate to [`http://localhost:5173`](http://localhost:5173) in your browser. Open multiple incognito tabs or separate browsers to test multiplayer rooms.

---

### Method 2: Running with Docker Compose (Production Setup)

To build and run all services (Redis, Server, and Client with Nginx) in Docker containers:

```bash
docker compose up --build
```

- **Frontend Client**: [`http://localhost:80`](http://localhost:80)
- **Backend Server**: [`http://localhost:3001`](http://localhost:3001)
- **Redis**: Port `6379`

To stop containers:
```bash
docker compose down
```

---

## ⚙️ Environment Variables

### Backend (`server/.env`)

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3001` | Port the HTTP and Socket.IO server listens on |
| `REDIS_HOST` | `localhost` | Hostname for Redis (`redis` when running in Docker) |
| `REDIS_PORT` | `6379` | Port for Redis connection |
| `CLIENT_ORIGIN`| `http://localhost:5173` | Allowed CORS origin for Socket.IO clients |

### Frontend (`client/.env`)

| Variable | Default | Description |
|---|---|---|
| `VITE_SERVER_URL` | `http://localhost:3001` | URL of the backend Socket.IO server |

---

## 📜 Available NPM Scripts

Run from the root directory:

| Command | Description |
|---|---|
| `npm run dev --workspace=server` | Runs backend in development mode with `nodemon` and `ts-node` |
| `npm run dev --workspace=client` | Runs frontend Vite dev server with Hot Module Replacement |
| `npm run build:client` | Compiles TypeScript and builds production client bundle |
| `npm run build:server` | Compiles backend TypeScript to `server/dist` |
| `npm run build` | Builds both client and server projects |

---

## 🔌 Socket.IO Event Reference

The app uses strictly typed Socket.IO events defined in `packages/types`:

### Client to Server
- `createRoom` — Request creation of a new room with a host name.
- `joinRoom` — Join an existing room via 6-character room code.
- `rejoinRoom` — Re-bind socket ID to an existing player upon page reload.
- `gameSettings` — Update round count, draw time, or player limits (host only).
- `startGame` — Start the match from the lobby (host only).
- `wordChosen` — Active drawer submits their chosen word.
- `draw` — Transmit canvas coordinate path, color, tool, and line thickness.
- `clearboard` — Drawer clears the canvas.
- `guess` — Player submits a guess or chat text.
- `playAgain` — Return players to the lobby at game completion.

### Server to Client
- `roomCreated` / `roomUpdated` — Broadcast room details and player list updates.
- `gamestarted` — Notify players that game is starting.
- `wordChoices` — Deliver 3 random word options exclusively to the drawer.
- `turnStart` — Notify clients of active drawer and start countdown.
- `timerTick` — Broadcast remaining seconds and letter hints every second.
- `draw` — Broadcast drawing events to other players in the room.
- `clearCanvas` — Broadcast canvas wipe signal.
- `correctguess` — Announce a successful guess and score gain.
- `chatmessage` — Relay chat text to all players.
- `scoreUpdate` — Update leaderboard scores in real time.
- `turnended` / `gameEnded` — Emit turn reveal and final game podium state.

---

## 📄 License

This project is open-source under the [ISC License](LICENSE).
