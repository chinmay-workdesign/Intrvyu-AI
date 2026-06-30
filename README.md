# Intrvyu AI - Voice Mock Interview Platform

Intrvyu AI is a production-quality, full-stack, AI-powered mock interview platform that simulates natural, low-latency, two-way verbal conversations. Powered by the **Google Gemini Live API** (via Google AI Studio) and a custom **LangGraph** state machine backend, the platform evaluates candidates across distinct professional personas, dynamically adjusts difficulty, maps subject coverage, and compiles detailed SaaS-style feedback reports.

---

## Architecture Overview

```
                          +---------------------------------------+
                          |        Frontend (Next.js 15)          |
                          |  - Web Audio API (PCM 16k/24k)        |
                          |  - Canvas Voice Wave Ripple           |
                          +-------------------+-------------------+
                                              |
                                              | WS PCM Chunks / Control
                                              v
                          +-------------------+-------------------+
                          |        Backend (Express.js)           |
                          |  - WebSocket Proxy Client             |
                          |  - JWT / BCrypt Auth Middleware       |
                          +---------+-------------------+---------+
                                    |                   |
                     REST Queries   |                   | WS Setup / MediaChunks
                                    v                   v
                        +-----------+-----------+   +---+-------------------+
                        |    Database (Prisma)  |   |    Gemini Live API    |
                        |   - PostgreSQL        |   |   (gemini-2.0-flash)  |
                        +-----------+-----------+   +---+-------------------+
                                    ^                   |
                                    |                   | Updates State
                                    +---------+---------+
                                              |
                                              v
                                  +-----------+-----------+
                                  |    LangGraph Engine   |
                                  | - Evaluation Node     |
                                  | - Difficulty Node     |
                                  | - Coverage Node       |
                                  | - Follow-up Node      |
                                  +-----------------------+
```

### Key Components

1. **Gemini Live WebSocket Proxy**: Merges low-latency voice streaming, duplex audio processing, and live interruption logic. Protects developer API credentials by securing connection parameters server-side.
2. **LangGraph State Engine**: Orchestrates interview progress. Every answer triggers a structured node cycle:
   - **Evaluation**: Scores communication, confidence, technical depth, and STAR alignment.
   - **Difficulty Adjustment**: Scales questions from Junior to Staff-level on-the-fly.
   - **Coverage Tracker**: Assesses complete competencies mapping for the specific track.
   - **Follow-up Decision**: Resolves whether to challenge gaps or pivot to new topics, injecting guidance prompts into the ongoing live voice stream.
3. **Web Audio Wave Visualizer**: Displays beautiful dynamic ripples showing input (speaking), output (AI talk), and system processing feedback.

---

## Folder Structure

```
x:/Intrvyu AI/
├── backend/
│   ├── src/
│   │   ├── controllers/      # Auth & Session handlers
│   │   ├── routes/           # REST Route declarations
│   │   ├── middleware/       # Auth validation middleware
│   │   ├── services/         # Gemini Live & REST Client services
│   │   ├── db/               # Prisma database client singleton
│   │   ├── graph/            # LangGraph State Machine
│   │   │   ├── state/        # InterviewState Interfaces
│   │   │   ├── prompts/      # Personas instructions & rubrics
│   │   │   └── graphEngine.ts # Node transition execution cycles
│   │   └── server.ts         # Express startup & WebSocket listeners
│   ├── prisma/               # schema.prisma relational definitions
│   ├── tsconfig.json         # ESM NodeNext configurations
│   └── package.json          # Node dependency declarations
├── frontend/
│   ├── app/                  # Next.js 15 Router Pages
│   ├── components/           # Reusable SaaS components (UI, Microphones)
│   ├── hooks/                # Web Audio API hooks (useAudioLive)
│   ├── services/             # REST fetch calls API client
│   ├── store/                # Zustand global stores (auth, interview)
│   ├── types/                # Typescript typings definitions
│   └── tailwind.config.ts    # Styling configuration guidelines
```

---

## Installation & Setup

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL Database Instance (Supabase / Local DB)
- Google AI Studio Gemini API Key (Generous free tier)

### 1. Database Setup

Ensure your PostgreSQL service is running. Set your configuration inside `backend/.env` (see template in `backend/.env.example`).
Then, initialize and generate the client schemas:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate
```

### 2. Run the Express Backend

Install dependencies and launch the server:

```bash
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000`.

### 3. Run the Next.js Frontend

Navigate to the frontend folder, install dependencies, and start the development server:

```bash
cd ../frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## API Documentation

### Auth Endpoints
- `POST /api/auth/signup`: Registers a new user. Expects JSON `{ email, password, name }`.
- `POST /api/auth/login`: Signs in a user and returns a signed JWT.

### Session Endpoints
- `POST /api/interview/start`: Creates an interview session. Expects `{ type, experienceLevel, resumeText, jobDescriptionText }`. Returns session metadata & initial greeting spoken audio.
- `POST /api/interview/message`: REST message fallback. Accepts multipart form-data (audio file). Returns next question audio & updated evaluation states.
- `POST /api/interview/end`: Closes active session and triggers feedback report compilation.
- `GET /api/interview/sessions`: Returns past interview list.
- `GET /api/interview/feedback/:id`: Returns feedback card and quote evaluations.
- `GET /api/interview/profile`: Returns user profile statistics and analytical score trends.
