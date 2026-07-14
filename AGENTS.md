# CodeKnights — Agent Codebase Index

Competitive programming platform: real-time 1v1 coding duels, solo practice, AI assistant, and leaderboards. Built with Next.js 14 (App Router), TypeScript, PostgreSQL/Prisma, NextAuth, Monaco Editor, Socket.io, and Docker-sandboxed code execution.

## Quick Start

```bash
npm install
# Set DATABASE_URL, NEXTAUTH_SECRET, OAuth keys (see Environment Variables)
npx prisma migrate dev
npm run dev          # Uses server.js (Next.js + Socket.io)
```

Production Docker image includes compilers and Docker CLI for sandboxed execution. `npm start` runs `next start` only — Socket.io real-time features require `server.js`.

---

## Directory Map

| Path | Purpose |
|------|---------|
| `src/app/` | App Router pages and API routes |
| `src/app/page.tsx` | Home → dynamically loads `MainMenu` (SSR off) |
| `src/components/MainMenu.tsx` | **App shell** (~3400 lines): window manager, duel state, Socket.io client, most global UI logic |
| `src/components/windows/` | Feature windows (editor, battle, profile, etc.) |
| `src/components/providers/` | `AuthProvider` (NextAuth SessionProvider) |
| `src/lib/` | Auth config, Prisma singleton, Monaco autocomplete, image crop |
| `src/constants/` | Themes, fonts, languages, i18n translations |
| `src/types/` | Shared TS types + NextAuth module augmentation |
| `src/styles/` | Global CSS |
| `prisma/` | Schema and migrations |
| `scripts/` | DB seeding |
| `server.js` | Custom HTTP server: Next.js + Socket.io + `/api/socket_online` |
| `problems.json` | Problem data for `npm run seed:problems` |
| `set-admin.js` | CLI: `node set-admin.js <email>` → sets `isAdmin` |
| `add_problem.py` | CLI: POST problems from `problem_info/` folder to admin API |

---

## Architecture

```
Browser (MainMenu.tsx)
  ├── REST → Next.js API routes → Prisma → PostgreSQL
  ├── Socket.io → server.js (duel progress, invites, online users)
  └── Monaco Editor → /api/run, /api/run-tests
```

**Window system:** `MainMenu` manages draggable/resizable windows. Window IDs are defined in `src/types/index.ts` (`WindowId` type).

**State pattern:** Most feature logic lives in `MainMenu.tsx` and is passed as props to window components. Windows are presentational + local UI state; duel/session/socket state is centralized in MainMenu.

---

## API Routes (`src/app/api/`)

### Auth
- `auth/[...nextauth]` — NextAuth handler (GitHub + Google OAuth)
- `auth/guest/delete` — Delete ephemeral guest users (no OAuth accounts)

### Duels
- `duels` POST — Create duel (PIN, question selection, guest auto-user, demo mode)
- `duels` GET — Fetch duel by `?pin=` (strips hidden test cases)
- `duels/join` — Guest joins WAITING duel
- `duels/quick` — Quick match (join/create `QM-*` lobby)
- `duels/public` — List open public lobbies
- `duels/poll` — Poll duel state (no-store)
- `duels/progress` — Persist live stats (code length, tests passed, snapshots)
- `duels/submit` — Submit/finalize/surrender/timeout; Elo calculation
- `duels/action` — Host accept/reject guest join

### Code Execution
- `run` — Single run with optional stdin; Docker → local → Wandbox fallback
- `run-tests` — Run public + hidden tests for a question
- `analyze` — Deterministic Big-O heuristic (no external AI)

### AI
- `agent` — Chat via Gemini/OpenAI/Groq/OpenRouter; 3 prompts/hour (unlimited for Royal)

### User / Social
- `user/profile` — GET profile + duels; POST update; DELETE account
- `user/update` — Update username/themeIndex
- `user/search` — Prefix search with friend-request status
- `user/friends`, `user/friends/remove` — Friends list and removal
- `user/request`, `user/requests`, `user/request/action` — Friend requests
- `user/follow` — Instant follow/unfollow
- `user/submissions` — Solo submission history
- `notes` — Load/save notes canvas JSON
- `leaderboard` — Top 100 + current user rank

### Admin
- `admin/questions` — CRUD problems (POST also accepts `Bearer ADMIN_API_KEY`)
- `admin/users` — List/delete users (admin session only)

### Stripe (Royal subscription)
- `stripe/checkout`, `stripe/webhook`, `stripe/success`, `stripe/cancel`

### Other
- `feedback` — Email feedback via Nodemailer

**Socket.io (server.js):** `identify`, `join_duel`, `leave_duel`, `progress_update`, `duel_update`, `opponent_surrendered`, `invite_duel`, `cancel_invite`, `reject_invite`, `accept_invite`, `online_users_update`

---

## Window Components (`src/components/windows/`)

| Component | Role |
|-----------|------|
| `EditorWindow` | Monaco editor, run, terminal, Vim mode |
| `ProblemWindow` | Problem statement, tests, duel timer, submit/finalize |
| `BattleWindow` | Quick match, PIN duels, public lobbies, game modes |
| `AgentWindow` | AI chat (disabled during active battles) |
| `ProfileWindow` | Stats, duel history, avatar, invites |
| `FriendsWindow` | Friends, search, requests, online status |
| `LeaderboardWindow` | Ratings table |
| `SettingsWindow` | Theme, font, language, Vim, window chrome |
| `AdminWindow` | Problem CRUD, user management |
| `TournamentWindow` | Client-side bracket tournaments |
| `NotesWindow` | Infinite canvas with linked note nodes |
| `TutorialWindow` | Onboarding |
| `RoyalWindow` | Subscription checkout |
| `FeedbackWindow` | Feedback form |
| `LegalWindow` | Privacy / terms |

---

## Lib & Constants

**`src/lib/auth.ts`** — NextAuth: Prisma adapter, GitHub/Google, Dicebear default avatar, session enrichment (`isAdmin`, `isRoyal`, battle stats).

**`src/lib/prisma.ts`** — Singleton PrismaClient.

**`src/lib/monacoAutocomplete.ts`** — Completion providers for C/C++/Python/Java.

**`src/lib/cropImage.ts`** — Avatar crop → base64 JPEG.

**`src/constants/languages.ts`** — Starter code templates, C++ STL keywords.

**`src/constants/themes.ts`** — ~30 editor color themes.

**`src/constants/translations.ts`** — UI strings (en, ro, fr, de, hi, ru, hu, es, it, zh, ja, pt).

---

## Database Models (Prisma)

| Model | Key fields |
|-------|------------|
| `User` | username, rating, rank, isAdmin, isRoyal, battle stats, notesData JSON |
| `Question` | title, description, testCases/hiddenTestCases JSON, difficulty, limits |
| `Duel` | pin, status, host/guest, readiness, solve times, Elo deltas, live progress |
| `Submission` | Solo practice submissions |
| `FriendRequest` | PENDING/ACCEPTED/REJECTED |
| `AiPrompt` | Hourly AI rate-limit tracking |
| `Account`, `Session`, `VerificationToken` | NextAuth |

Schema: `prisma/schema.prisma`

---

## External Integrations

- **Stripe** — Royal subscription ($9.99/mo); mock fallback when keys missing
- **Socket.io** — Real-time duel progress, invites, online users (requires `server.js`)
- **AI providers** — Gemini (default), OpenAI, Groq, OpenRouter via `/api/agent`
- **Code execution** — Docker sandboxes (prod), local toolchain (dev), Wandbox fallback
- **Dicebear** — Default identicon avatars
- **Nodemailer** — Feedback emails

Supported languages: C, C++, Python, Java.

---

## Environment Variables

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | PostgreSQL connection |
| `NEXTAUTH_SECRET` | NextAuth signing |
| `GITHUB_ID`, `GITHUB_SECRET` | GitHub OAuth |
| `GOOGLE_ID`, `GOOGLE_SECRET` | Google OAuth |
| `ADMIN_API_KEY` | Bearer token for admin question API (default: `dev-admin-key`) |
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` | Stripe |
| `GOOGLE_API_KEY` / `GEMINI_API_KEY` | Gemini AI |
| `OPENAI_API_KEY`, `GROQ_API_KEY`, `OPENROUTER_API_KEY` | Other AI providers |
| `AI_PROVIDER` | Force provider: `google`, `openai`, `groq`, `openrouter` |
| `GOOGLE_MODEL`, `GOOGLE_ENDPOINT` | Gemini config |
| `EMAIL_SERVICE`, `EMAIL_USER`, `EMAIL_PASS` | Feedback SMTP |
| `CODEKNIGHTS_EXECUTOR` | `local` / `docker` / auto |
| `CODEKNIGHTS_PREFER_LOCAL` | `1` = skip Docker in auto mode |
| `NODE_ENV`, `PORT` | Server config |

---

## Conventions for Contributors

- **TypeScript** throughout; functional React components with hooks
- **App Router** API routes export HTTP method handlers (`GET`, `POST`, etc.)
- **Auth:** Use `getServerSession(authOptions)` in API routes; session fields extended in `src/types/next-auth.d.ts`
- **Prisma:** Import from `@/lib/prisma` (singleton)
- **i18n:** Add keys to `src/constants/translations.ts` for all supported languages
- **New windows:** Add to `WindowId` in `src/types/index.ts`, import in `MainMenu.tsx`, wire open/close state
- **Hidden test cases:** Never expose `hiddenTestCases` to clients in duel GET/poll responses
- **Code execution:** Malicious-pattern blocking in `/api/run` and `/api/run-tests`; prefer Docker in production

---

## npm Scripts

| Script | Command |
|--------|---------|
| `dev` | `node server.js` |
| `build` | `next build` |
| `start` | `next start` |
| `lint` | `next lint` |
| `seed:problems` | Upsert questions from JSON file |
