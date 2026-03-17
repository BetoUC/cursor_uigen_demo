# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run setup          # npm install + prisma generate + prisma migrate dev
npm run dev            # Next.js dev server with Turbopack (localhost:3000)
npm run build          # Production build
npm run lint           # ESLint
npm test               # Vitest (all tests)
npm test -- path/to/file.test.ts  # Single test file
npm run db:reset       # Reset Prisma migrations (destructive)
```

## Environment Variables

- `ANTHROPIC_API_KEY` — Claude API key. If unset, the app uses a `MockLanguageModel` that returns static demo components.
- `JWT_SECRET` — Defaults to `"development-secret-key"` if unset.

## Architecture

UIGen is an AI-powered React component generator. Users describe components in natural language; Claude generates them into a **virtual file system** (in-memory, no disk writes), rendered live in a sandboxed iframe.

### Request Flow

1. User submits a prompt in `ChatInterface`
2. `ChatProvider` (wraps `useChat` from `@ai-sdk/react`) POSTs to `/api/chat` with messages, current virtual FS state, and projectId
3. `/api/chat/route.ts` calls `streamText()` with Claude Haiku 4.5, two tools (`str_replace_editor`, `file_manager`), and a system prompt from `src/lib/prompts/generation.tsx`
4. Claude streams text + tool calls back; `FileSystemProvider` processes tool calls to update the virtual FS
5. `PreviewFrame` re-renders the updated virtual FS as a live React preview
6. On stream finish, if authenticated, the project is saved to SQLite via Prisma

### Key Subsystems

**Virtual File System** (`src/lib/file-system.ts`, `src/lib/contexts/file-system-context.tsx`)
- `VirtualFileSystem` class holds all files in memory keyed by path
- Entry point for preview is always `/App.jsx`
- `FileSystemProvider` context exposes the FS and processes LLM tool calls

**LLM Tools** (`src/lib/tools/`)
- `str_replace_editor` — view, create, str_replace, insert operations on virtual files
- `file_manager` — rename and delete operations

**AI Provider** (`src/lib/provider.ts`)
- Returns real `@ai-sdk/anthropic` provider if `ANTHROPIC_API_KEY` is set
- Falls back to `MockLanguageModel` (returns hardcoded tool calls for Counter/Form/Card) — max 4 steps
- Real Claude uses max 40 steps

**Auth** (`src/lib/auth.ts`, `src/actions/index.ts`)
- JWT via `jose`, stored as `httpOnly` cookie (`auth-token`), 7-day expiry
- `signUp` / `signIn` / `signOut` / `getUser` are Next.js Server Actions
- Passwords hashed with bcrypt (10 rounds)
- Middleware at `src/middleware.ts` protects `/api/projects` and `/api/filesystem`

**Database** (`prisma/schema.prisma`)
- SQLite at `prisma/dev.db`
- Two models: `User` and `Project`
- `Project.messages` and `Project.data` are JSON-stringified strings (chat history + FS snapshot)
- `Project.userId` is nullable — supports anonymous sessions

**Anonymous Users** (`src/lib/anon-work-tracker.ts`)
- Work is tracked in `sessionStorage`; on sign-in/up, anonymous work can be migrated to the new account

### Routing

| Route | Purpose |
|---|---|
| `/` | Home — redirects authenticated users to their latest project |
| `/[projectId]` | Project workspace (main editor/preview/chat layout) |
| `/api/chat` | Streaming LLM endpoint |

### State Management

- `FileSystemProvider` — virtual FS state, tool call processing
- `ChatProvider` — chat messages, streaming state (wraps Vercel AI SDK `useChat`)
- `useAuth` hook — current user session

### Testing

Tests live in `__tests__` directories co-located with source. Key test areas:
- `src/lib/__tests__/file-system.test.ts` — VirtualFileSystem operations
- `src/components/chat/__tests__/` — Chat component rendering
- `src/lib/contexts/__tests__/` — Context behavior
- `src/lib/transform/__tests__/jsx-transformer.test.ts` — JSX transform used by preview

Test environment: jsdom via Vitest + `@testing-library/react`.
