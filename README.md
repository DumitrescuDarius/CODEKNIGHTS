# CodeKnights ⚔️

CodeKnights is a premier competitive programming platform that brings developers together in high-stakes, real-time coding duels. Built with performance and user experience in mind, CodeKnights features a full-stack Next.js environment, sandboxed code execution, real-time Socket.io synchronization, and an innovative draggable window UI interface.

![CodeKnights Arena](https://via.placeholder.com/800x400?text=CodeKnights+Arena)

---

## 🌟 Game Modes

CodeKnights offers a variety of game modes to test different programming skills:

- **⚔️ CodeKnights (Classic):** A standard 1v1 duel where both players race to solve algorithmic problems as fast as possible.
- **🛡️ Bug Hunter:** Players are given a codebase containing subtle logic bugs. The first one to successfully debug and pass all hidden test cases wins.
- **🕵️ HackBounty:** A two-phase adversarial mode:
  - *Phase 1 (Breaking):* Both players receive a working solution and have 2 minutes to maliciously modify it (up to 10% change) to introduce invisible bugs.
  - *Phase 2 (Fixing):* The codes are swapped! Players must hunt down and fix the bugs their opponent introduced.
- **🪄 ML Mages:** Fast-paced solo or 1v1 optimization challenges where you improve the efficiency of machine learning and data science scripts.

---

## 💻 Features

- **Draggable Window Shell UI:** A beautifully designed, draggable, and resizable window system mimicking a desktop OS, giving users maximum flexibility.
- **Real-Time Multiplayer:** Built on WebSockets (Socket.io) to instantly sync duel states, online users, friend requests, and match progress.
- **Secure Code Execution Sandbox:** A robust execution pipeline that runs untrusted C, C++, Python, and Java code securely inside isolated Docker containers (with Wandbox fallback).
- **Pro-Grade Editor:** Monaco Editor integration featuring full syntax highlighting, intelligent autocompletion (LSP support), and an optional Vim keymap mode.
- **Advanced Elo Rating System:** Dynamic leaderboards and Elo rating adjustments after every ranked match.
- **AI Agent Assistant:** A built-in AI tutor powered by Gemini/OpenAI/Groq that explains code complexities, helps you optimize solutions, and acts as an intelligent pair programmer (disabled during active duels for fair play).
- **Internationalization (i18n):** Complete translation support for 12+ languages.
- **Customizable Themes:** Over 30 curated syntax themes to personalize your workspace.

---

## 🛠️ Technology Stack

### Frontend
- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **State Management & UI:** React, Framer Motion (fluid animations), Lucide React (icons)
- **Code Editor:** Monaco Editor (`@monaco-editor/react`)

### Backend
- **Server Environment:** Node.js custom HTTP server (merging Next.js and Socket.io)
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Authentication:** NextAuth.js (GitHub & Google OAuth)
- **Real-Time Communication:** Socket.io
- **Code Execution:** Docker Engine (isolated containerized execution pipelines)

### DevOps & Integrations
- **Payments:** Stripe integration for *Royal* premium subscriptions.
- **AI Providers:** Unified integration supporting Google Gemini, OpenAI, Groq, and OpenRouter.

---

## 🚀 Quick Start

### Prerequisites
- Node.js (v18+)
- PostgreSQL database
- Docker (for local code execution sandbox)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/your-username/codeknights.git
   cd codeknights
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   Create a `.env` file in the root directory based on the following template:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/codeknights"
   NEXTAUTH_SECRET="your-secret"
   GITHUB_ID="your-github-id"
   GITHUB_SECRET="your-github-secret"
   
   # Execution Config (local | docker)
   CODEKNIGHTS_EXECUTOR="docker"
   ```

4. **Initialize the database:**
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

5. **Seed the initial problem sets:**
   ```bash
   npm run seed:problems
   ```

6. **Start the development server:**
   *Note: Always use `npm run dev` to start the custom server.js wrapper which enables Socket.io real-time features.*
   ```bash
   npm run dev
   ```

7. **Open your browser:**
   Navigate to `http://localhost:3000` and start coding!

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's adding new coding challenges, fixing UI bugs, or optimizing the execution engine, please feel free to open an issue or submit a Pull Request.

---

## 📜 License

This project is proprietary and confidential. Unauthorized copying of this file, via any medium is strictly prohibited.
