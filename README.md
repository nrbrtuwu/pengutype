# PenguType

A fast, modern typing test app built with Next.js, React, TypeScript, Zustand, and Framer Motion.

## Features

- Time and words test modes
- Multiple language wordlists (including English 1k/5k variants)
- Smooth animated caret and theme system
- Restart shortcut options (`Tab` or `Tab + Enter`)
- New-best detection per bucket (mode + setting + language)
- Full-screen confetti celebration for new personal bests
- In-page stats popout with segmented mode stats

## Tech Stack

- Next.js 16 (App Router)
- React 19
- TypeScript
- Zustand (persisted state)
- Framer Motion
- Tailwind CSS

## Getting Started (npm)

### 1) Install dependencies

```bash
npm install
```

### 2) Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 3) Build for production

```bash
npm run build
```

### 4) Start production server

```bash
npm run start
```

### 5) Typecheck

```bash
npm run typecheck
```

## Project Structure

```text
app/                # App Router pages/layout
components/         # UI + feature components
languages/          # JSON wordlists
lib/                # Store, words utilities, themes
```

## Notes

- Stats are grouped by exact test bucket:
  - Time mode: duration + language (e.g. 60s + English)
  - Words mode: word count + language (e.g. 25 words + English)

## Database Backup (Vercel + Neon)

The app can back up local typing history to Postgres for persistence and future leaderboard features.

### 1) Create a Neon Postgres database in Vercel

- In Vercel, add a **Neon Postgres** integration to your project.
- Copy the connection string to `DATABASE_URL`.

### 2) Add environment variable

Create `.env.local` (or use Vercel project env vars):

```bash
DATABASE_URL=your_neon_connection_string
```

### Local development with Docker (optional)

If you want to run Postgres locally before deploying to Vercel/Neon:

1. Start local DB

```bash
npm run db:up
```

2. Set local connection in `.env.local`

```bash
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/pengutype
```

3. Run app

```bash
npm run dev
```

Useful commands:

```bash
npm run db:logs
npm run db:psql
npm run db:down
```

### 3) Deploy / run

- API route: `GET/POST /api/results`
- Table `typing_results` is auto-created on first request.
- When signed in with Discord, the app pulls your cloud personal bests and uploads new local bests in the background. The API only reads/writes the signed-in user's results.

This gives you cloud history backups now and a clean base for Discord-auth accounts and leaderboards later.

## Discord Login (identify only)

This project uses Auth.js with Discord OAuth and requests only the `identify` scope.

Set these environment variables in `.env.local` (and Vercel):

```bash
AUTH_SECRET=your_random_secret
AUTH_DISCORD_ID=your_discord_client_id
AUTH_DISCORD_SECRET=your_discord_client_secret
```

Notes:

- Account identification uses Discord user ID (`session.user.id`).
- No email scope is requested.
