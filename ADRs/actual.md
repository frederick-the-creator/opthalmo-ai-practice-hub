
## Application Architecture - Codebase Organisation
Monorepo structure
    - Monorepo with two main applications
        - `apps/frontend/` - Vite + React + TypeScript UI (shadcn-ui, Tailwind)
        - `apps/backend/` - Express + TypeScript API server 
    - Currently no shared libs
    - Root package.json with workspaces array; 
    - dependency-cruiser rules for layers + no cross-app imports + “only import from package public API” (enforce index.ts barrels). **ToDo** 
    **Implement tsconfig and lint type enforcement. Lint scripts. Automate linting before commit**
    **Code rules - Never use Type Assertion**
    **Favor being explicit - E.g. with typing, using DNR to reduce inline types. E.g. throw New Error instead of throw Error**
    **Avoid type casting. Want to take advantage of TS structural typing to trigger compile-time failure if mistmatches**
Types
    - “Domain persistence” types for repositories/mappers (what the DB needs) - Domain types are created automatically from supabase generated types so when DB changes this is reflected.
    - “API DTOs” for boundary validation (what the client may send) - Eliminate drift by deriving the API DTO’s TypeScript type from the domain type, and make the Zod schema conform to that type using Zod’s generic type parameter.
     are driven by database.types.ts to capture change to database
    - Domain types
    - What about implementing zod validation at DB
Frontend Structure
    - Layered / Type-based architecture structure under `apps/frontend/src/`
    - Use React Router with route modules under src/routes/. **ToDo**
    - Components colocated with routes/features; each feature exposes a public API via index.ts Depcruise rule: routes cannot import other routes directly (only via features/shared).  **ToDo**
Backend Structure
    - Layered routes/ → services/ → repos/ (currently no controllers/  **ToDo**)
        - Routes should remain thin: parse/validate input, authenticate, call a service, translate errors to HTTP status codes.
        - Services enforce domain rules (e.g., booking guards, role checks) and orchestrate repository calls.
        - Repositories are persistence-only (CRUD with mapping). They must not embed business rules.
    - Global Middleware for validation and error handling (instead of inline)
    - Depcruise rules: routes can depend on controllers, not vice versa. **ToDo**
Data
    - DB use in backend vs frontend: Frontend reads simple lists/details directly from Supabase using the typed client. All writes and multi-service workflows (rooms/rounds/profile updates, recording, transcription, assessment) go through the backend Express API, which authenticates and uses a token-scoped Supabase client (`req.supabaseAsUser`) to honor RLS and encapsulate business logic.
Frontend Data
    - UI/local state: useState/useReducer only for ephemeral UI state.
    - The app currently manages state with `useState`/`useEffect` and Supabase Realtime subscriptions (`subscribeToAllPracticeRooms`, `subscribeToPracticeRoomByRoomId`, `subscribeToPracticeRoundsByRoomId`) alongside direct reads (`fetchAllRooms`, `fetchRoomWithProfiles`, `fetchRoundsByCandidate`, `fetchCaseBriefs`).
    - Server cache: Use TanStack Query for remote/server state (fetching, caching, retries) **ToDo**
    - HTTP only via a shared @/api/client (no fetch in components). ESLint rule: ban direct fetch in apps/web/src except in api/client. Ban axios completely. Depcruise: pages/components may import api/client but not fetch.**Implement fetch**
Error Handling Strategy
    - Backend: throw typed errors; map to JSON { code, message, details } with correct status codes. Use centralised utility (e.g., `HttpError`) to carry HTTP status codes from services to routes. 
    - Frontend: Global React Error Boundary for unexpected errors; in-query errors surfaced via standard components. Frontend must centralize repeated API error mapping via `mapApiError(err, context)` in `apps/frontend/src/services/api/utils.ts` to keep components lean and consistent.
    - Backend services should throw `HttpError(status, message)` from `apps/backend/utils/httpError.ts`; routes must catch it and respond with `res.status(err.status).json({ error: err.message })`.
Logging with correlation IDs **Need to implement**
    - Use pino on server with a request-scoped correlation ID. Middleware injects ID and logger; lint rule bans console.log in server code
Environment configuration management **Need to implement**
    - Load env via dotenv in dev; rely on platform vars in prod.
    - Validate with Zod at process start; no defaults for secrets.
    - env.ts schema; CI check requires .env.example updated in PRs.
Security
    - Backend: Helmet, rate limiting, strict CORS allowlist
    - Repo: gitleaks secret scanning; dep scan (npm audit/Snyk); SAST (Semgrep/CodeQL).
    - CI jobs for secret + dep + SAST scans
Authentication
    - Backend middleware validates requests using Supabase access tokens via the `Authorization: Bearer <token>` header and creates per request authenticated supabase client. Frontend attaches the token in an Axios interceptor.
    - Frontend uses supabase access token in Auth Provider. Context Provider: `AuthProvider` (`apps/frontend/src/store/AuthProvider.tsx`) is mounted in `apps/frontend/src/App.tsx` and exposes via `useAuth()` the following: `user`, `session`, `loading`, `userProfile`, `reloadProfile()`, and `signOut()`. 
    - Admin supabase client used only when necessary. Favour authenticated client. 

## Technology / Tooling Architecture - The concrete tech stack and developer tooling
Monorepo workspace manager - Using npm workspaces
Frontend built with React + Vite + Typescript
Backend with Node.js + Express 5 + Typescript
Zod for data validation
React Router
pino

## Code-style / Programming Model - Coding conventions & async model
- Typescript everywhere
    - Enable "strict": true, plus noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns, noImplicitAny, CI runs tsc --noEmit 
    - npm run typecheck in CI; fail on errors.
Use async/await; no callbacks. 
async handlers wrapped.
- Shared types over inline types.
 - Type definitions placement.
  - Prefer defining types in the same module as the function/component that uses them.
  - When a type is needed across multiple modules or layers, move it to centralized shared types: backend in `apps/backend/types/index.ts`, frontend in `apps/frontend/src/types/index.ts`.
  - Keep mappers in `types/index.ts` the single source of truth for DB <-> domain conversions.
  - Time fields: use `startUtc` in domain models; DB column is `start_utc` (legacy `datetime_utc`).
  - Avoid ad-hoc, duplicated type declarations; promote shared types instead when reuse emerges.


## Data Architecture - Storage and Flow
Database
    - Supabase 
- Identifiers - Use UUID for primary keys
- Store all times in UTC in createdAt, updatedAt, optional deletedAt (soft delete). Convert to the viewer’s timezone only at the edges
- Naming snake_case in DB, camelCase in application types - Convert all database types to application types for use in application and vice versa
- FKs on by default. All relationships must have foreign keys with ON DELETE/ON UPDATE policies documented (cascade, restrict, set null).
- Define UNIQUE constraints (e.g., email per tenant) and composite keys where applicable.
- Row-level security by default on all tables, requiring authentication for access
- Admin client used


## System Architecture - Servers, APIs, DBs
API Schema and Validation at boundaries
    - Single source of truth Zod schema - share zod schemas in packages/api-schema and deriving everything else (server validation + client types) from it so nothing drifts **To Do**
    - Use Zod schemas at all external boundaries
        Server: validate request params/body; validate responses. 
                validate API responses in repositories
        Client: validate API responses in api/client for critical endpoints.
        - Lint rule requiring a schema for new routes; PR checklist item.
REST API Style Guide
        - Resource nouns; plural; verbs only for actions. **Make plural**
        - Status codes aligned to semantics
        - Pagination via ?page/?limit or cursors; sorting/filtering conventions.
    - Enforcement:
        - API linting (openapi linter) if OpenAPI used; PR checklist.


Naming convention for similar functions in different layers in backend



Auth model: sessions or JWT (access + refresh) and rotation policy; cookie security flags if cookies.
RBAC/ABAC: document roles/permissions and enforcement point (service or middleware).
Password & OAuth: hashing (argon2/bcrypt), OAuth providers if needed; email verification & reset flows.

Backups & migrations: automated backups, restore drills; migration run policy (app starts vs CI step).
PII handling: data classification, encryption at rest/transport; retention & deletion (GDPR/DSR).
Audit log: who did what when (if admin actions exist).



## Component Architecture - UI composition

## Infrastructure Architecture - Deployment and Scaling