
## Application Architecture - Codebase Organisation

Monorepo structure and workspace manager
    - Decision:
        - Structure: Outline structure showing monorepo only (apps/frontend, apps/backend)
        - Using npm
    - Enforcement:
        - Root package.json with workspaces array; tsconfig path aliases; CI forbids cross-app relative imports.
    - **Need to implement shared types**
Frontend built with React + Vite
    - Decision
        - Use React with Vite. Target modern browsers
Backend with Node.js + Express
    - Use Express with TypeScript. Structure by feature modules. - Use async/await; no callbacks. **Structure by feature modules is not correct**
- Frontend routing & file layout
    - Decision
        - Use React Router with route modules under src/routes/.
        - Components colocated with routes/features; each feature exposes a public API via index.ts.
    - Depcruise rule: routes cannot import other routes directly (only via features/shared).
- Frontend Module boundaries and import rules **This isn't current setup - Align to current setup**
    - Decision:
        - Feature-first structure under src/features/<feature> with a public index.ts. **What does this mean
        - Shared code lives in @/shared or packages/* and is the only cross-feature dependency.
    - Enforcement:
        - dependency-cruiser config forbids cross-feature imports and deep imports.


- Typescript everywhere
    - Decision:
        - Enable "strict": true, plus noUncheckedIndexedAccess, exactOptionalPropertyTypes, noImplicitReturns
    - Enforcement:
        - npm run typecheck in CI; fail on errors.
- Frontend Data fetching and state separation
    - Decision:
        - UI/local state: useState/useReducer only for ephemeral UI state.
        - Server cache: Use TanStack Query for remote/server state (fetching, caching, retries) **Need to implement useQuery**
        - HTTP only via a shared @/api/client (no fetch in components).
    - Enforcement:
        - ESLint rule: ban direct fetch in apps/web/src except in api/client. 
        - Depcruise: pages/components may import api/client but not fetch.
        - **Update rule for axios or leave, depending on what is recommended by AI**
- API Schema and Validation at boundaries
    - Decision:
        - Use Zod schemas at all external boundaries
            Server: validate request params/body; validate responses. 
                    validate API responses in repositories
            Client: validate API responses in api/client for critical endpoints.
    - Enforcement:
        - Lint rule requiring a schema for new routes; PR checklist item.
- Express layering and routing pattern
    - Decision:
        - Folder pattern: routes/ → controllers/ → services/ → repos/. **Implement controllers**
        - One global error middleware; async handlers wrapped.
        - Request validation middleware uses Zod.
    - Enforcement:
        - Depcruise rules: routes can depend on controllers, not vice versa.

- Error Handling Strategy
    - Decision:
        Server: throw typed errors; map to JSON { code, message, details } with correct status codes. Use centralised utility
        Client: Global React Error Boundary for unexpected errors; in-query errors surfaced via standard components.
    - Enforcement:
        - Unit tests for error mapping; shared HttpError class.
- REST API Style Guide
    - Decision:
        - Resource nouns; plural; verbs only for actions.
        - Status codes aligned to semantics
        - Pagination via ?page/?limit or cursors; sorting/filtering conventions.
    - Enforcement:
        - API linting (openapi linter) if OpenAPI used; PR checklist.





**Supabase**

- Security Baseline for web / API
    - Decision
        - API: Helmet, rate limiting, strict CORS allowlist, input validation (Zod), csrf for state-changing requests if using cookies.
        - Repo: gitleaks secret scanning; dep scan (npm audit/Snyk); SAST (Semgrep/CodeQL).
    - Enforcement
        - CI jobs for secret + dep + SAST scans; middleware registered in server bootstrap.


- Logging with correlation IDs **Need to implement**
    - Decision:
        - Use pino on server with a request-scoped correlation ID
    - Enforcement:
        - Middleware injects ID and logger; lint rule bans console.log in server code
- Environment configuration management **Need to implement**
    - Decision:
        - Load env via dotenv in dev; rely on platform vars in prod.
        - Validate with Zod at process start; no defaults for secrets.
    - Enforcement:
        - env.ts schema; CI check requires .env.example updated in PRs.

- Testing Strategy
    - Decision:
        - Unit: Vitest for TS; React Testing Library for components.
        - API: Supertest for Express.
        - E2E: Playwright for critical flows only.
        - Contracts: Schemas (Zod) serve as contract; add snapshot tests for API envelopes.
    - Enforcement:
        - CI runs unit → API → e2e; minimum coverage targets on packages with shared logic.
- Code Quality Gates
    - Decision:
        - ESLint for code quality, React hooks/import rules, security linting.
        - Prettier for formatting only.
        - TypeScript strict checks as build gate.
    - Enforcement:
        - CI order: prettier-check → eslint → typecheck; fail build on violations.
- Dependency policy & dead-code control
    - Decision:
        - Prefer stdlib/approved libs; new deps require lightweight justification in PR.
        - Run knip to detect unused files/exports/deps; ts-prune to fail on unused exports.
        - Monthly dep updates on schedule.
    - Enforcement:
        - CI jobs for knip + ts-prune; Renovate (or manual) update cadence.
- Git & PR policy
    - Decision:
        - Small, atomic PRs; Conventional Commits; PR template/checklist (pattern used? schema? tests?).
    - Enforcement:
        - Branch protection
- Build & release (CI pipeline)
    - Decision
        - CI stages: lint → typecheck → unit → api → e2e → package/build → security scans.
        - Artifacts per app; environment-specific configs
    - Enforcement:
        - Required checks on main before merge.

- Feature Flags and Configuration
    - Decision
        - Simple boolean flags via config at build/runtime; guard risky changes behind flags; document cleanup timeline.
    - Enforcement
        - CI check for expired flags (lint rule scanning for @flag:expires= annotations).