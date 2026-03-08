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

### 5) Lint

```bash
npm run lint
```

## Project Structure

```text
app/                # App Router pages/layout
components/         # UI + feature components
languages/          # JSON wordlists
lib/                # Store, words utilities, themes
public/             # Static assets (icons, etc.)
```

## Notes

- This repo includes both `package-lock.json` and `pnpm-lock.yaml`, but the project is fully runnable with **npm** commands above.
- Stats are grouped by exact test bucket:
  - Time mode: duration + language (e.g. 60s + English)
  - Words mode: word count + language (e.g. 25 words + English)
