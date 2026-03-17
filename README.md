# UIGen

AI-powered React component generator with live preview, powered by Claude.

---

## Prerequisites

Before getting started, make sure you have the following installed:

| Tool | Version | Notes |
|---|---|---|
| [Node.js](https://nodejs.org) | 18+ | Required for Next.js and all tooling |
| [npm](https://www.npmjs.com) | Comes with Node.js | Used for dependency management |
| [Git](https://git-scm.com) | Any recent version | For cloning the repo |

To verify:
```bash
node -v    # should be v18 or higher
npm -v
git -v
```

---

## 1. Clone the Repository

```bash
git clone https://github.com/BetoUC/cursor_uigen_demo.git
cd cursor_uigen_demo
```

---

## 2. Environment Setup

Create a `.env` file in the project root:

```bash
cp .env.example .env   # if .env.example exists, otherwise create manually
```

Open `.env` and add your Anthropic API key:

```env
ANTHROPIC_API_KEY=your-api-key-here
```

> **Where to get an API key:** Sign up at [console.anthropic.com](https://console.anthropic.com), go to API Keys, and create a new key.
>
> **Running without a key:** The app will still run — instead of calling Claude, it will return static placeholder code. Useful for UI development without incurring API costs.

---

## 3. Install Dependencies & Initialize the Database

Run the setup script, which handles everything in one command:

```bash
npm run setup
```

This command:
1. Installs all npm dependencies (`npm install`)
2. Generates the Prisma client (`npx prisma generate`)
3. Runs database migrations to create the SQLite database (`npx prisma migrate dev`)

After this you should see a `prisma/dev.db` file — that's the local SQLite database.

---

## 4. Run the Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

The app uses Turbopack for fast hot-module reloading. Changes to source files reflect in the browser instantly without a full page refresh.

---

## All Available Commands

| Command | Description |
|---|---|
| `npm run dev` | Start the development server (Turbopack) |
| `npm run build` | Build for production |
| `npm run start` | Start the production server (run after build) |
| `npm run setup` | Install deps + generate Prisma client + run migrations |
| `npm run test` | Run the test suite with Vitest |
| `npm run lint` | Run ESLint checks |
| `npm run db:reset` | Reset the database and re-run all migrations (destructive) |
| `npm run dev:daemon` | Start the dev server in the background, logs to `logs.txt` |

---

## How to Use the App

1. Open [http://localhost:3000](http://localhost:3000)
2. **Sign up** for an account or click **Continue as guest** to use anonymously
3. Type a description of the React component you want in the chat (e.g. *"Create a responsive card component with a title, description, and a call-to-action button"*)
4. Watch the component generate in real-time in the **Preview** panel on the right
5. Switch to the **Code** tab to view, edit, and copy the generated files
6. Keep chatting to iterate — ask for changes, new components, or refinements

> **Guest vs. Signed-in users:** Guest sessions are temporary. Sign up to persist your projects across sessions.

---

## Project Structure

```
src/
├── app/                   # Next.js App Router pages and API routes
│   ├── api/chat/          # Streaming chat endpoint (calls Claude)
│   └── [projectId]/       # Per-project page
├── components/
│   ├── chat/              # Chat UI: MessageList, MessageInput, ToolInvocationBadge
│   ├── editor/            # Monaco code editor and file tree
│   ├── preview/           # Live iframe preview
│   └── auth/              # Sign in / sign up dialogs
├── lib/
│   ├── tools/             # Claude tool definitions (file create/edit/delete)
│   ├── transform/         # JSX → browser-runnable JS transformer
│   ├── contexts/          # React context providers (file system, chat)
│   └── prompts/           # System prompt for Claude
├── actions/               # Next.js server actions (project CRUD)
└── hooks/                 # Custom React hooks
prisma/
├── schema.prisma          # Database schema (User, Project)
└── migrations/            # Auto-generated SQL migration history
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| AI | Anthropic Claude via Vercel AI SDK |
| Database | SQLite via Prisma |
| Code Editor | Monaco Editor |
| Testing | Vitest + Testing Library |

---

## Troubleshooting

**`Error: Cannot find module '.prisma/client'`**
Run `npm run setup` — the Prisma client needs to be generated before the app starts.

**Port 3000 already in use**
```bash
npx kill-port 3000
npm run dev
```

**Database out of sync after pulling new changes**
```bash
npx prisma migrate dev
```

**Reset everything and start fresh**
```bash
npm run db:reset   # wipes all data and re-runs migrations
```
