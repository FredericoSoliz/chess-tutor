<div align="center">

# ♞ Chess Tutor

**Learn chess with engine analysis, AI coaching and real progress tracking.**

[Live demo](https://chess-tutor-gilt.vercel.app)

![Go](https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Python](https://img.shields.io/badge/Python-3.11-3776AB?logo=python&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-336791?logo=postgresql&logoColor=white)
![Cloud Run](https://img.shields.io/badge/Google_Cloud_Run-4285F4?logo=google-cloud&logoColor=white)
![Vercel](https://img.shields.io/badge/Vercel-000000?logo=vercel&logoColor=white)

</div>

---

## What it does

Chess Tutor is a full-stack web app that imports your Lichess games, analyses them with Stockfish, and lets you train against an AI coach that gives natural-language feedback after every move you play.

It combines three different "AI" components:
- **Stockfish** for hard chess analysis (eval, centipawn loss, best move per position)
- **Groq Llama 3.3 70B** as the default in-game coach LLM (fast, free tier, OpenAI-compatible API)
- **A local LLM** (Qwen 2.5 7B running on my home GPU, reached via Tailscale) as a fallback when Groq is unreachable — and as the "demo flex" running on my own hardware

The result is a tool that plays back your games like Lichess analysis, but with a coach that actually *talks* to you about your moves.

## Features

- 📊 **Dashboard** — rating evolution per speed, win rate by colour, top openings with win %, recent games
- ♛ **Lichess sync** — incremental import via the Lichess API (`since` param, NDJSON streaming)
- 🔍 **Analysis page** — full Stockfish review of any synced game: per-move category (`★ ! ? ?? ??`), accuracy (Lichess formula), eval bar with best-move arrows
- 📥 **Import PGN** — drop any PGN file in the browser, get the same review without uploading anywhere
- 🤖 **AI Coach** — play against Stockfish at five Elo levels with an LLM that comments every move (with opening recognition from the Lichess openings DB)
- ⚙️ **Settings** — link Lichess account, change password, set default difficulty, force re-sync
- 📱 **Responsive** — desktop-first but works on mobile (drawer menu, stacked panels)

## Architecture

```
                 ┌──────────────────────────────┐
                 │    Vercel — React + Vite     │
                 └──────────────┬───────────────┘
                                │ HTTPS
                                ▼
                 ┌──────────────────────────────┐
                 │  Cloud Run — Go (Gin + GORM) │
                 │  • Auth (JWT)                │
                 │  • Games / Dashboard / Sync  │
                 │  • Analysis & Coach proxies  │
                 └────┬──────────────┬──────────┘
                      │              │
                      ▼              ▼
       ┌──────────────────┐   ┌─────────────────────────────┐
       │   Supabase       │   │  Cloud Run — Python + Flask │
       │   (Postgres)     │   │  • Stockfish engine         │
       └──────────────────┘   │  • Lichess openings DB      │
                              │  • LLM proxy + fallback     │
                              └──────────┬──────────────────┘
                                         │ Tailscale (userspace)
                                         ▼
                              ┌──────────────────────────────┐
                              │  Groq — Llama 3.3 70B (primary)  │
                              │  Home PC — LM Studio Qwen 7B     │
                              │  (fallback via Tailscale)        │
                              └──────────────────────────────┘
```

## Tech stack

**Backend** — Go 1.21, Gin, GORM, golang-jwt, bcrypt, gin-contrib/cors
**Engine service** — Python 3.11, Flask, [python-chess](https://github.com/niklasf/python-chess), Stockfish 17, [Lichess openings database](https://github.com/lichess-org/chess-openings)
**Frontend** — React 19, Vite, React Router, axios, [chess.js](https://github.com/jhlywa/chess.js), [react-chessboard](https://github.com/Clariity/react-chessboard) v5
**Data** — PostgreSQL on Supabase (session pooler), JSONB for game metadata
**LLM** — Groq Llama 3.3 70B Versatile (cloud, primary), LM Studio + Qwen 2.5 7B Instruct (local, fallback via Tailscale), OpenAI-compatible REST
**Infra** — Google Cloud Run (backend + engine service), Vercel (frontend), Tailscale (tailnet for home-to-cloud LLM), GitHub Actions (CI/CD), Artifact Registry, Cloud Build
**Containers** — Docker, multi-service docker-compose for local development

## How the coach works

For every move you play against the in-app bot, the engine service does three things in parallel:

1. Analyses the position **before** and **after** your move at full Stockfish strength → produces `cp_loss`, `category`, `best_move`.
2. Plays the bot's reply at the chosen `UCI_Elo` (Stockfish drops to Skill Level for very weak levels).
3. Builds a structured prompt for the LLM with the recent move history, opening name (looked up against the Lichess openings TSV), eval before/after, and the move category — then calls Groq Llama 3.3 70B first, falling back to the local LM Studio (Qwen 2.5 7B) over Tailscale if Groq fails.

The LLM never sees raw FENs alone — it gets the engine's verdict and writes a natural commentary on top, with strict rules per category (best/excellent never suggest alternatives, blunder explains what was missed, opening phase recognises the opening by name).

## Running locally

```bash
git clone https://github.com/FredericoSoliz/chess-tutor.git
cd chess-tutor

cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
# edit backend/.env — at minimum set JWT_SECRET (and LICHESS_TOKEN if you want sync)

docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8080
- Engine service: http://localhost:5000
- Postgres: localhost:5432

For the coach to talk locally, [install LM Studio](https://lmstudio.ai), load `qwen2.5-7b-instruct`, and enable the local server on port 1234 with "Serve on Local Network" on.

## Deployment

Production deploy is **fully automated** via GitHub Actions on push to `master`:

- `frontend/**` changes → **Vercel** auto-deploys via Git integration
- `backend/**` changes → workflow at `.github/workflows/deploy-backend.yml` deploys to Cloud Run
- `engine-service/**` changes → workflow at `.github/workflows/deploy-engine.yml` deploys to Cloud Run

Secrets (DB URL, JWT secret, Lichess token, Groq key, Tailscale auth key, LLM proxy) live in Cloud Run environment variables. The deploy workflow uses `gcloud run deploy --source` so existing env vars are preserved between deploys.

## Project structure

```
chess-tutor/
├── backend/             Go service (Gin + GORM)
│   ├── handler/         HTTP handlers
│   ├── service/         Business logic
│   ├── repository/      DB access (GORM)
│   ├── dto/             Request/response types
│   ├── model/           DB models
│   ├── middleware/      Auth middleware
│   └── database/        Connection setup
├── engine-service/      Python service (Flask + Stockfish)
│   ├── engine/          Stockfish wrapper
│   ├── coach/           LLM client + prompt builder + openings lookup
│   └── app.py           Routes
├── frontend/            React + Vite SPA
│   └── src/
│       ├── pages/       Dashboard / Games / Analysis / Coach / Settings / Login
│       ├── components/  Layout, Sidebar, Navbar, ChessBoard, etc.
│       ├── hooks/       useChessGame, useAnalysis
│       └── services/    axios-based API clients
└── .github/workflows/   CI/CD pipelines
```



---

<sub>Built solo over a few weeks as a portfolio project. Made in Portugal 🇵🇹</sub>
