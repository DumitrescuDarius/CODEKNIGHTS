# CodeKnights: Competitive Programming Arena

CodeKnights is a high-octane, web-based platform designed for competitive programmers to test their skills in real-time coding duels. Featuring an integrated Monaco-based code editor, real-time synchronization, and AI-powered assistance, it provides a complete environment for honing algorithmic skills.

## Features

- **Coding Duels:** Engage in 1v1 battles with real-time feedback.
- **Dynamic Arena:** Real-time problem solving with automatic test case validation.
- **AI Assistant:** Integrated AI coding help to explain complexities and optimize solutions (with battle-mode safety disabling).
- **Interactive UI:** Window-based management system for a fluid coding experience.
- **Internationalized:** Full support for multiple languages including English, Romanian, French, German, Hindi, Russian, Hungarian, Spanish, Italian, Chinese, Japanese, and Portuguese.
- **Progression System:** Track your rating, rank, and battle history.

## Technology Stack

- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **Language:** [TypeScript](https://www.typescriptlang.org/)
- **Database/ORM:** PostgreSQL with [Prisma](https://www.prisma.io/)
- **Authentication:** [NextAuth.js](https://next-auth.js.org/)
- **Editor:** [Monaco Editor](https://microsoft.github.io/monaco-editor/) (with Vim keybindings)
- **UI:** React, Framer Motion, Lucide React

## Getting Started

### Prerequisites

- Node.js (v18+)
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd codeknights
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file based on `.env.example` and set your `DATABASE_URL`, `NEXTAUTH_SECRET`, and API keys (OpenAI/Google Gemini).

4. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

## Development

- **Architecture:** The UI utilizes a window management system located in `src/components/windows/`.
- **API:** Backend logic resides in `src/app/api/`.
- **Translations:** All UI strings are localized via `src/constants/translations.ts`.

## Contributing

Contributions are welcome! Please open an issue to discuss proposed changes or improvements.
