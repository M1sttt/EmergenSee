---
name: emergensee-dev
description: >
  Complete development guide for EmergenSee — a real-time emergency coordination platform built as a pnpm+Turborepo monorepo. Stack: React 18 + Vite + Tailwind (web app) | NestJS 10 + MongoDB (REST API) | FastAPI + DeepFace (Python face-recognition service at ../emergensee-facerecognition/).
  Use this skill for ANY task in the EmergenSee codebase: adding new pages, implementing features, fixing bugs, writing tests, touching the face-recognition service, or reviewing architecture decisions. Always invoke when working in this project — even if the task looks simple, this skill contains the CI gate rules, commit policy, and patterns that must be followed.
---

## Project Context

EmergenSee is a real-time emergency coordination platform for organizations. When an emergency alarm fires, registered departments receive the alert. Users report their safety status through the web app; safe-room cameras automatically detect faces via AI and suggest which users are present. Senior management sees a unified dashboard with live statuses, event data, and maps.

**Two repositories:**
- Primary repo: the current working directory (monorepo — web + API + shared packages).
- Face-recognition service: a separate Python microservice repo. Its location varies per developer machine. When a task involves the face-recognition service, do a quick single-pass lookup — check `../emergensee-facerecognition/` relative to the monorepo root. If that directory doesn't exist, ask the user: *"What's the path to the face-recognition service repo on your machine?"* — don't spend effort searching further.

**Roles in the system:** `ADMIN`, `VIEWER`, `MEMBER`, `CAMERA`

---

## Repository Map

```
EmergenSee/
├── apps/
│   ├── web/                    # React 18 + Vite frontend
│   │   └── src/
│   │       ├── components/
│   │       │   ├── ui/         # Atomic primitives: Button, Badge, Input, Label, IconButton, Textarea, FieldError
│   │       │   └── common/     # Reusable blocks: ConfirmModal, GenericTable, Loader
│   │       ├── pages/          # Page-level components (one folder per page)
│   │       ├── hooks/data/     # TanStack Query hooks per page (useEventsPageData, etc.)
│   │       ├── hooks/          # Domain hooks: useWebSocket, useGoogleGSI, useOfflineStatusQueue
│   │       ├── services/       # HTTP + WS wrappers: api.ts, authService, eventsService, etc.
│   │       ├── store/          # Zustand: authStore.ts (persisted)
│   │       ├── types/          # Local types (shared types come from packages/shared)
│   │       └── App.tsx         # Router + route guards
│   └── api/                    # NestJS 10 backend
│       └── src/
│           ├── services/
│           │   ├── auth/       # JWT + local + Google OAuth strategies
│           │   ├── users/
│           │   ├── events/
│           │   ├── departments/
│           │   ├── status/
│           │   └── websocket/  # Socket.IO gateway
│           ├── common/         # Decorators, guards (JwtAuthGuard)
│           ├── config/         # Swagger setup
│           ├── app.module.ts
│           └── main.ts
├── packages/
│   ├── shared/                 # Types, Zod schemas, constants shared across apps
│   │   └── src/
│   │       ├── types/          # user, event, status, department, websocket types
│   │       ├── schemas/        # Zod validation schemas
│   │       └── constants/      # JWT TTLs, pagination defaults, WS event names
│   ├── eslint-config/          # ESLint rules (base, react, library)
│   └── tsconfig/               # Shared tsconfig (base.json, react.json)
├── .github/workflows/ci.yml    # CI: lint → typecheck → test → build
├── turbo.json
└── pnpm-workspace.yaml

emergensee-facerecognition/   ← path varies per machine; ask user if not found at ../emergensee-facerecognition/
└── src/
    ├── main.py                 # FastAPI app factory + lifespan
    ├── config.py               # Pydantic settings
    ├── dependencies.py         # DI wiring (lru_cache singletons)
    ├── domain/                 # Pure domain (no framework deps)
    │   ├── entities/face.py    # BoundingBox, DetectedFace, RecognitionResult
    │   └── ports/              # Abstract interfaces: detection, recognition, storage
    ├── application/            # Use cases: detect, recognize, register, delete
    ├── adapters/
    │   ├── ai/deepface_adapter.py        # RetinaFace detection + ArcFace recognition
    │   └── persistence/mongo_face_storage.py
    └── api/
        ├── routers/faces.py    # Route handlers
        └── schemas/face_schemas.py
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Monorepo | Turborepo + pnpm workspaces (Node ≥20, pnpm ≥8) |
| Frontend | React 18, Vite 5, TypeScript (strict), Tailwind CSS |
| State | TanStack Query v5 (server state) + Zustand v4 (client/auth state) |
| Forms | React Hook Form + Zod |
| HTTP client | Axios (with JWT interceptor + refresh in `services/api.ts`) |
| Real-time | Socket.IO client v4 + NestJS WebSocketGateway |
| Mapping | Leaflet + react-leaflet |
| Face AI (client) | MediaPipe vision tasks |
| Backend | NestJS 10, TypeScript (strict) |
| Database | MongoDB + Mongoose (local only — no Atlas/cloud) |
| Auth | JWT (access + refresh) + Passport strategies (local, JWT, Google OAuth) |
| API docs | Swagger via NestJS decorators |
| Tests (web) | Playwright (E2E) |
| Tests (api) | Jest |
| Linting | ESLint + Prettier (enforced by CI) |
| Face recognition service | FastAPI + DeepFace (RetinaFace + ArcFace) + Motor (async MongoDB) |
| Python tooling | Poetry, Ruff, mypy strict |

---

## Frontend Architecture

### Component Hierarchy

```
ui/          → atomic primitives (Button, Badge, Input, Label, Textarea, IconButton, FieldError)
common/      → reusable composed blocks (ConfirmModal, GenericTable, Loader)
components/  → feature-specific components (EventForm, DepartmentForm, UserForm, Layout, etc.)
pages/       → full pages, one folder each, composed from above
```

**Rules:**
- Functional components only.
- Props type: always `{ComponentName}Props`.
- Reuse `ui/` primitives before creating anything new. Do not add new primitives unless strictly necessary.
- No inline `fetch` or `axios` calls inside components — all HTTP goes through `services/*.ts`.
- Extract any complex state/query logic into a `hooks/data/use{PageName}Data.ts` hook.
- Tailwind CSS only — no CSS modules, no styled-components. Mobile-first: `class → md:class`.

### Data Flow

```
Page component
  └── useXxxPageData hook (TanStack Query + mutations)
        └── xxxService.ts (Axios calls)
              └── api.ts (Axios instance with Authorization header + refresh interceptor)
```

### Auth State

`store/authStore.ts` — Zustand store persisted to localStorage. Contains user, tokens. Cleared on logout or failed refresh. `api.ts` reads tokens from this store automatically via interceptors.

### Route Guards

- `ProtectedRoute` — requires authenticated user
- `AdminRoute` — requires `ADMIN` role
- `CameraRoleGuard` — requires `CAMERA` role
- `FaceRegistrationGuard` — redirects to face registration if user has no `faceIdentity`

### Real-time Updates

1. `websocketService.ts` connects Socket.IO on app load.
2. `useWebSocket` hook listens for `WebSocketEventType` events.
3. On event received, call `queryClient.invalidateQueries(...)` to refetch.
4. Never directly update TanStack Query cache from socket events — always invalidate and re-fetch.

---

## Backend Architecture

### 3-Layer Pattern

```
Controller  →  validates input (DTO + class-validator), calls service
Service     →  business logic, calls Mongoose models, emits WebSocket events
Mongoose    →  MongoDB schema + query
```

**Rules:**
- Every controller endpoint has a matching DTO with `class-validator` decorators.
- Every endpoint has Swagger decorators: `@ApiTags`, `@ApiOperation`, `@ApiResponse`, `@ApiBearerAuth`.
- Guards: `@UseGuards(JwtAuthGuard)` on protected routes. Role checks inside service or via custom decorators.
- No business logic in controllers; no DB queries in controllers.
- File uploads go to local filesystem under `/uploads`; no cloud storage.

### MongoDB Patterns

- User has `faceIdentity` (string) linking to face-recognition DB.
- Event has `location: GeoJSON Point` with `2dsphere` index for `events/nearby` queries.
- Department hierarchy uses MongoDB `$graphLookup` for recursive department expansion.
- StatusUpdate has `location: GeoJSON Point` with `2dsphere` index.

### WebSocket Gateway

`websocket.gateway.ts` emits events to rooms. Key events:
- `event:created`, `event:updated`, `event:deleted`
- `status:updated`
- `camera:frame`, `camera:recognize`, `camera:join`, `camera:leave`
- `department:alert`

Camera stations connect with role `CAMERA` and send frames to the gateway, which fans out to admin viewers.

---

## Shared Package (`packages/shared`)

Types consumed by both web and API. Always prefer importing from `@emergensee/shared` rather than redefining locally.

**Key enums:**
```typescript
enum UserRole    { ADMIN, VIEWER, MEMBER, CAMERA }
enum UserStatus  { ACTIVE, INACTIVE, SUSPENDED }
enum EventType   { FIRE, MEDICAL, ACCIDENT, CRIME, NATURAL_DISASTER, HAZMAT, OTHER }
enum EventPriority { LOW, MEDIUM, HIGH, CRITICAL }
enum EventStatus { ONGOING, RESOLVED, CANCELLED }
enum ResponderStatus { AWAY, NEED_HELP, SAFE, UNKNOWN }
enum WebSocketEventType { EVENT_CREATED, EVENT_UPDATED, EVENT_DELETED, STATUS_UPDATED, ... }
type Location = { type: 'Point'; coordinates: [lon, lat] }
```

When adding new types that span both web and API, add them to `packages/shared/src/types/` and export from the package index.

---

## Face Recognition Service

**Repo:** `../emergensee-facerecognition/` (FastAPI + DeepFace)

**Architecture:** Hexagonal (ports & adapters). Domain has zero framework deps. Ports define interfaces; adapters implement them.

**API base:** `http://localhost:8000` (configurable via env)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Liveness probe |
| POST | `/api/v1/faces/detect` | Detect all faces (bounding boxes) |
| POST | `/api/v1/faces/recognize` | Identify faces against registered DB |
| POST | `/api/v1/faces/register` | Register new person (name + image) |
| POST | `/api/v1/faces/register/batch` | Register 2–15 frames for one identity |
| DELETE | `/api/v1/faces/{identity}` | Remove registered person |

All image endpoints: `multipart/form-data`, field `image` (JPEG/PNG/WebP).

**Key config knobs (`.env`):**
- `RECOGNITION_THRESHOLD` — cosine distance cutoff (lower = stricter). Default 0.38.
- `DETECTOR_BACKEND` — `retinaface` | `mtcnn` | `opencv`. Default: retinaface.
- `RECOGNITION_MODEL` — `ArcFace` | `Facenet512`. Default: ArcFace.
- `MIN_SHARPNESS` — Laplacian variance floor (rejects blurry frames).
- `MIN_FACE_SIZE_PX` — bounding box size floor (rejects tiny detections).

**Temporal cache:** The adapter caches recognition results per bounding box for 2.5 s using IoU matching — redundant frame submissions in quick succession return cached results without re-running the model.

**Registration best practice:** 3–5 images per person from different angles for best recall.

**When editing the face-recognition service:**
- Follow hexagonal architecture: domain changes stay in `domain/`, new AI backends go in `adapters/ai/`, new storage backends in `adapters/persistence/`.
- All config changes go through `config.py` (Pydantic BaseSettings).
- Python style: Ruff + mypy strict. No `Any`, no bare `except:`.
- Run `ruff check src/` and `mypy src/` before committing.

---

## Code Style

### File & Folder Naming
- kebab-case everywhere: `event-form.tsx`, `auth.service.ts`, `users.controller.ts`
- Exception: React component files are PascalCase: `EventForm.tsx` (file name matches component name)

### TypeScript
- Strict mode. No `any`. No unused locals or parameters.
- Use types from `packages/shared` when they exist.
- Arrow functions: `const fn = () => {}` over `function fn() {}`.
- Always destructure props in function signature: `const EventForm = ({ event, onSubmit }: EventFormProps) => {}`.

### Comments
- Write NO comments by default.
- Only comment when the WHY is non-obvious: a hidden invariant, a regex, a workaround for a specific bug, or subtle business logic.
- Never write "what" comments (`// fetch the user`, `// handle submit`).
- Never write AI-generated descriptive block comments or docstrings.
- If editing an existing file, with a comment that doesnt follow those rules, delete it.

### Imports
- No unused imports. Remove before committing.
- Never leave dead code, commented-out blocks, or `console.log` statements.

### Tailwind
- Mobile-first. Base classes for mobile, `md:` for desktop.
- Color palette: blue as primary (`blue-500` = `#3b82f6`). Grays for text/backgrounds.
- Use existing `ui/` component classes before adding raw Tailwind to page-level components.

---

## Git Workflow

### Branching
- `feature/{feature-name}` for new features
- `fix/{bug-name}` for bug fixes
- `misc/{description}` for chores, cleanup, config changes
- Never commit directly to `master` or `integration`

### Commit Rules
1. **Never add Co-Authored-By or any AI signature** to commit messages.
2. **Short, indicative messages** — as a human developer would write them.
3. **Format:** `<type>(<scope>): <short description>`
   - Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`
   - Examples: `feat(events): add geospatial nearby filter`, `fix(auth): handle expired refresh token`, `chore: update turbo pipeline`
4. **Commit atomically** — one logical change per commit. Don't batch unrelated changes.
5. **Commit often** — don't accumulate 15 files in one commit.
6. Before writing a commit message, **read `git log --oneline -20`** and match the style and granularity of recent commits.

### Pre-Commit CI Gate (MANDATORY)

Before every commit, verify these pass locally. CI runs exactly these four jobs:

```bash
pnpm lint        # ESLint across all workspaces
pnpm typecheck   # tsc --noEmit across all workspaces
pnpm test        # Jest (API) + any other configured test runners
pnpm build       # Turborepo build of all apps and packages
```

If any command fails, fix the issue before committing. Do not use `--no-verify` or any bypass. If `pnpm test` requires a running MongoDB and you're in a no-DB environment, at minimum run `pnpm lint` and `pnpm typecheck` and note that tests were skipped.

**For the face-recognition Python service**, before committing run:
```bash
ruff check src/
mypy src/
```

### Pull Requests
- All feature branches merge via PR, not direct push.
- Check the PR template (`.github/pull_request_template.md`) and fill in type of change + testing notes.

---

## Large Task Detection

A task is **large** when it requires changes across multiple layers or introduces a new vertical slice. Triggers from git history and project structure:

**Large tasks (use sub-agent workflow below):**
- Adding a new page/route (e.g., new dashboard view, new admin panel section)
- Implementing a feature that touches: controller + service + schema + React page + hooks + service file (any combination of 4+ files across layers)
- New WebSocket event type: gateway → frontend hook → UI update
- Face registration or recognition flow changes spanning the API and the Python service
- New department/event/status feature that requires schema changes + aggregation pipeline changes + frontend
- Authentication flow changes (new strategies, new guards, new token types)
- New shared types that need to be added to `packages/shared`
- Any feature involving geospatial queries
- Adding a new role or permission system change
- Offline queue or sync logic changes
- New integration between the Node API and the face-recognition Python service

**Small tasks (inline, no sub-agent):**
- Bug fix scoped to 1–2 files
- Adding a field to an existing form/DTO
- Updating component styling
- Adding a toast notification
- Fixing a TypeScript error
- Updating a Swagger decorator
- Adding a small validation rule
- Fixing a single WebSocket handler

### Sub-Agent Workflow for Large Tasks

Execute mentally in sequence before writing any code:

**1. Context Agent (Planning)**
- Read relevant existing pages, hooks, services, and schemas to understand current patterns.
- Identify which `ui/` components and `common/` blocks can be reused.
- Map out all files that will need to change.
- Confirm no new UI primitives are needed.

**2. Efficiency Agent (Design)**
- Find the shortest path from current state to goal.
- Prefer extending existing files over creating new ones where it doesn't hurt clarity.
- No new libraries unless the existing stack truly can't handle it.

**3. Clean Code Agent (Review)**
- Enforce DRY across the planned changes.
- Verify no descriptive AI comments will appear.
- Confirm no unused imports, variables, or dead branches.

**4. Coder Agent (Execution)**
- Write the code with strict TypeScript, proper DTOs, Swagger decorators, and Tailwind mobile-first.
- Run the CI gate commands before staging any files.

---

## When to Use Caveman Skill

Use `/caveman` (or invoke the `caveman:caveman` skill) for long research sessions, large refactors, or any conversation that is accumulating a lot of context. Caveman mode compresses responses ~75%, keeping the context window lean without losing technical precision. Good triggers:

- Exploring a complex bug across multiple files
- Summarizing what you found during codebase research
- Reporting the status of a multi-step implementation
- Any response that would otherwise be more than ~200 words of prose

Use `/caveman-commit` when generating commit messages — it produces short, accurate, conventional-commit messages without filler.

Use `/cavecrew` when you need to delegate a lookup or small edit to a subagent to protect the main context.

---

## When to Use Skill-Creator

Use `/skill-creator:skill-creator` when:
- The user asks to create a new reusable skill or slash command
- A workflow is being repeated so often it should be automated into a skill
- A large task pattern (as defined above) keeps recurring and should be codified

Do NOT invoke skill-creator for standard development tasks — only when the goal is to create or improve a skill itself.

---

## Testing Strategy

**High ROI, low maintenance.** Don't over-test.

**API (Jest):**
- Unit tests for service methods containing critical business logic (recursive department expansion, status update rules, token refresh logic).
- Mock MongoDB models and external services.
- Test happy paths and high-risk edge cases; skip trivial getters/setters.

**Web (Playwright E2E):**
- One comprehensive test per critical user journey: auth flow, creating an event, reporting status, face registration skip.
- Do not write E2E tests for every UI state — only flows that cross multiple pages or involve real network calls.

**Python service:**
- Tests go in `tests/unit/` and `tests/integration/` using pytest + pytest-asyncio.
- Mock DeepFace in unit tests (it has heavy dependencies).
- Integration tests can hit a real MongoDB (use `docker-compose up` for local dev).

---

## Bug Fix & Refactor Policy

For fixes and refactors (anything that is NOT a new page or new feature):

- **Edit & delete first.** Fix by modifying existing code, not by adding new layers.
- **Minimal surface area.** Touch only the files needed to fix the issue.
- **No new abstractions** unless the existing code is genuinely broken by their absence.
- **No cleanup** unrelated to the bug being fixed. Separate refactors belong in separate commits.

---

## Security Rules

- Never commit `.env` files. They are git-ignored.
- JWT secrets stay in the API `.env` only.
- No API keys (external services) in the frontend — all AI/external calls route through the NestJS backend.
- Camera login (`/auth/camera-login`) is a separate auth flow with `CAMERA` role — never expose regular user credentials through camera endpoints.
- Face identity strings are normalized (lowercase + underscores) and stored by the Python service. The Node API stores only the identity string reference (`user.faceIdentity`), not image data.

---

## Environment Notes

- **MongoDB:** Local only. No Atlas. Connection via `MONGO_URI` in `.env`.
- **Face recognition service:** Runs separately on port 8000 (Docker or direct). Start with `docker-compose up` in `../emergensee-facerecognition/`.
- **Dev:** `pnpm dev` from monorepo root starts all apps via Turborepo.
- **Build:** `pnpm build` builds all packages in dependency order.
- **Workspace commands:** `pnpm --filter @emergensee/web dev` to run a single app.
