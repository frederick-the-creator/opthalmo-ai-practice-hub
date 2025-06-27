## 1  State architecture 🔁 — Detailed Implementation Notes

### 1-A  Create `useInterviewSession` hook

**Purpose** – centralise every bit of session logic (data-fetching, realtime, role/stage calculation, DB writes) and give UI code a single, declarative API.

1. **Inputs**  
   * `sessionId` (string | null) — supplied by `InterviewPracticeRoom`.

2. **Internal responsibilities**  
   1. **Initial fetch** — read the `practice_sessions` row once on mount.  
   2. **Realtime subscription** — open a Supabase channel for that row; merge each payload into local state.  
   3. **Role derivation** — compare `supabase.auth.user.id` with `host_id` and `guest_id`; return `'host' | 'guest' | null'`.  
   4. **Stage derivation** — convert the numeric `version` to a **Stage** enum (see §1-B).  
   5. **Boolean helpers** — compute `isCandidate`, `isInterviewer`, etc. from the row + authed user.  
   6. **Side-effect helpers** — small, promise-returning functions that *only* write to the DB. Local state is refreshed by the realtime event that follows:  
      * `updateStage(nextStage)`  
      * `setCase(caseId)`  
      * `setCandidate(userId)`

3. **Values returned by the hook**
   
ts
   {
     session,      // latest row, or null while loading
     stage,        // Stage enum
     role,         // 'host' | 'guest' | null
     isCandidate,  // boolean
     updateStage,  // helper functions …
     setCase,
     setCandidate,
     error         // string | null
   }

4. **Error handling**  
   * Wrap every Supabase call in `try / catch`.  
   * On failure, assign a message to `error`; leave the previous state intact.  
   * The hook should never throw; components stay mounted.

---

### 1-B  Introduce a *Stage* enum

| Enum key | DB value | Human meaning                                |
|----------|----------|----------------------------------------------|
| `PREP`       | 1 | Room open, choosing candidate/case              |
| `INTERVIEW`  | 2 | Live examination in progress                   |
| `WRAP_UP`    | 3 | Interview ended, review & next-steps            |

* Define the enum in a shared file (e.g. `types.ts`) and re-export it.  
* Outside the hook, never reference the raw numbers—use the enum.

---

### 1-C  Guarded transitions (business rules)

| Event name        | Allowed current stage(s) | Allowed actor | Next stage | Preconditions                             |
|-------------------|--------------------------|---------------|-----------|-------------------------------------------|
| `START_INTERVIEW` | `PREP`                   | Host          | `INTERVIEW` | Both `candidate_id` **and** `case_id` set |
| `FINISH_INTERVIEW`| `INTERVIEW`              | Host          | `WRAP_UP`   | —                                         |
| `RESET_TO_PREP`   | `INTERVIEW`, `WRAP_UP`   | Host          | `PREP`      | —                                         |

* Implement these checks **inside** `updateStage`.  
* If violated, reject the promise (hook sets `error`).  
* Never write illegal state to the DB.

---

### 1-D  Centralise side-effects

* DB writes happen **only** in the hook’s helpers; UI buttons do **not** call Supabase directly.  
* Don’t “optimistically” set local state; wait for the realtime event to confirm.  
* Toasts/notifications live next to the helper functions, not in the component.

---

### 1-E  Remove duplicated local state

After adopting the hook:

* Delete component-level `useState` for `version`, `hostId`, `guestId`, `candidateId`, `role`, etc.  
* Replace each reference with the corresponding field from the hook.  
* Buttons now call `updateStage(...)`, never raw Supabase calls.

---

### 1-F  Unit tests for the hook

1. **Happy path** — mock session with `version = 1`; expect `stage === PREP` and correct `role`.  
2. **Guard enforcement** — call `updateStage(INTERVIEW)` as a *guest*; promise rejects, state unchanged.  
3. **Realtime update** — simulate `postgres_changes` payload with `version = 2`; hook updates `stage` automatically.

---

### 1-G  Migration plan

1. Build the hook + enum in isolation.  
2. Refactor `InterviewPracticeRoom` to consume the hook while keeping old polling behind a feature flag.  
3. Manual QA the full flow.  
4. Remove obsolete polling `useEffect`s.  
5. Merge the feature branch.
