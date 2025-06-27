# Component-decomposition implementation plan  
*(aligned with the latest `InterviewPracticeRoom` that uses `useInterviewSession` and the `Stage` enum)*

---

## 0. File / folder scaffold
src/features/interview-room/
├─ InterviewPracticeRoom.tsx # orchestrator only
├─ HeaderBar.tsx # top bar
├─ VideoPane.tsx # left iframe/error/loading
├─ panels/
│ ├─ PrepPanel.tsx # stage PREP
│ ├─ InterviewPanel.tsx # stage INTERVIEW (candidate & interviewer modes)
│ └─ WrapUpPanel.tsx # stage WRAP_UP
└─ briefs/
   └─ Brief.tsx # reusable collapsible markdown block

## 1. Component contracts

### 1.1 `<HeaderBar>`

| prop         | type                               | purpose                                        |
|--------------|------------------------------------|------------------------------------------------|
| `stage`      | `Stage`                            | decide if **Back** appears                     |
| `role`       | `'host' \| 'guest' \| null`        | only host can see Back                         |
| `updating`   | `boolean`                          | disable buttons while DB writes are in flight  |
| `onExit`     | `() => void`                       | navigate to dashboard                          |
| `onBack`     | `() => void`                       | call `updateStage(...)` to step backwards      |

Render logic: always show **Exit**; show **Back** when `role === 'host'` and `stage !== Stage.PREP`.

---

### 1.2 `<VideoPane>`

| prop      | type                 | purpose                                                |
|-----------|----------------------|--------------------------------------------------------|
| `roomUrl` | `string \| null`     | iframe source                                          |
| `error`   | `string \| null`     | if present, show red banner                            |

Visual states  
1. `error` → banner  
2. `roomUrl` truthy → iframe  
3. neither → “Loading meeting room…” placeholder

---

### 1.3 Panel components (right-side column)

#### `PrepPanel`

| prop | type | notes |
|------|------|-------|
| `session` | practice_sessions row | contains `hostId`, `guestId`, `candidateId`, `caseId` |
| `cases` | array of case rows | list from `fetchCases` |
| `role` | `'host' \| 'guest' \| null` | host controls selection |
| `updating` | boolean | disables buttons while saving |
| `onSelectCandidate(id)` | fn | host chooses candidate |
| `onSelectCase(id)` | fn | host chooses case |
| `onStartCase()` | fn | host starts interview |

#### `InterviewPanel`

| prop | type |
|------|------|
| `session` | practice_sessions row |
| `cases`   | array |
| `role`    | `'host' \| 'guest' \| null` |
| `isCandidate` | boolean |
| `updating` | boolean |
| `onFinishCase()` | fn (host only) |
| `onBack()` | fn (host only) |

Internal split: `isCandidate ? <CandidateSide /> : <InterviewerSide />`.

#### `WrapUpPanel`

| prop | type |
|------|------|
| `role` | `'host' \| 'guest' \| null` |
| `updating` | boolean |
| `onExit()` | fn |
| `onDoAnother()` | fn (host only) |
| `onTranscript()` | fn (placeholder) |

---

### 1.4 `<Brief>`

| prop | type | purpose |
|------|------|---------|
| `title` | `string` | collapsible header text |
| `markdown` | `string \| null` | rendered via `renderMarkdownToReact` |
| `placeholder` | `string` | fallback when `markdown` is empty |
| `defaultOpen?` | `boolean` | optional initial state |

Uses the same Collapsible primitives for consistent styling.

---

## 2. Build & migration steps

1. **Extract HeaderBar** — copy top-bar JSX into its own component; replace with `<HeaderBar … />`.
2. **Extract VideoPane** — move iframe / loading / error block into new component; parent passes `roomUrl` & `error`.
3. **Create Brief** — move one Collapsible block into `<Brief>`; replace repeated blocks in InterviewPanel.
4. **Build PrepPanel** — move PREP right column; rely on callback props instead of direct DB writes.
5. **Build InterviewPanel** — move INTERVIEW right column; split candidate vs interviewer view; use callbacks.
5b. **Refactor InterviewPracticeRoom**  
   const rightPanel = stage === Stage.PREP
       ? <PrepPanel {...props}/>
       : stage === Stage.INTERVIEW
           ? <InterviewPanel {...props}/>
           : <WrapUpPanel {...props}/>;
   return (
     <>
       <HeaderBar … />
       <div className="layout">
         <VideoPane roomUrl={session?.roomUrl ?? null} error={error} />
         {rightPanel}
       </div>
     </>
   );
6. **Build WrapUpPanel** — move WRAP_UP right column; host-only actions via callbacks.
7. **Delete unused handlers & leftover conditional JSX** — remove `handleBackToVersion1`, etc., now absorbed into panel props.

---

## 3. Styling & design tokens

* Add `primary`, `primary-fg` colours to Tailwind config and replace hex codes.  
* Eliminate new inline `style={…}` blocks; prefer class names.  
* Re-export a shared button variant (e.g. `btn-primary`) from your UI library.

---

## 4. Testing checklist

| Component | Assertions (React Testing Library) |
|-----------|------------------------------------|
| HeaderBar | Back appears only for host & non-PREP; buttons disabled when `updating`. |
| VideoPane | Shows error banner; iframe when URL; loader otherwise. |
| Brief | Renders placeholder if no markdown; collapses/expands on trigger. |
| PrepPanel | Start disabled until both candidate & case selected; callbacks fire. |
| InterviewPanel | Candidate/interviewer views show correct briefs; Finish button host-only. |
| WrapUpPanel | Host sees all buttons; guest sees none. |

Add a Cypress happy-path flow PREP → INTERVIEW → WRAP_UP using the new component tree.

---

## 5. Cleanup tasks

1. Run ESLint & Prettier.  
2. Remove legacy polling code and unused imports.  
3. Add or update Storybook stories for every new component.  
4. Open PR referencing this plan and tick items when complete.
