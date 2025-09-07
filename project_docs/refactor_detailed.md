## 1. Extract Session Logic to a Custom Hook

### Goal
Move all business logic and state management related to interview session scheduling out of the main component and into a reusable custom hook (e.g., `useInterviewScheduling.ts`). This will make the main component cleaner, more readable, and easier to test and maintain.

---

### Steps


#### 1.2. Move State Variables into the Hook 
- Move all relevant `useState` declarations from `InterviewScheduling.tsx` into the hook:
  - `sessions`, `loading`, `error`
  - `selectedDate`, `selectedTime`, `sessionType`
  - `scheduling`, `scheduleError`
  - `currentUserId`
  - `copied` (if invite logic is included)

#### 1.3. Move Side Effects into the Hook
- Move all `useEffect` logic into the hook:
  - Fetching the current user and sessions on mount.
  - Any other effects related to session or user state.

#### 1.4. Move Handlers into the Hook
- Move all handler functions into the hook:
  - `handleAcceptInvitation`
  - `handleScheduleSession`
  - `handleCopyLink` (if invite logic is included)
  - Any other event handlers related to session management.

#### 1.5. Move API Calls into the Hook
- Move all direct calls to Supabase or backend APIs into the hook.
- If needed, import utility functions (e.g., `createPracticeRoom`) inside the hook.

#### 1.6. Expose State and Handlers
- Return all state variables and handler functions from the hook so they can be used in the main component and passed as props to panels.

#### 1.7. Type Definitions
- Define and export any types/interfaces needed for sessions, user, etc., within the hook file or a shared types file.

#### 1.8. Usage in Main Component
- In `InterviewScheduling.tsx`, replace all local state and handlers with a single call to the hook:
  ```tsx
  const {
    sessions, loading, error, currentUserId,
    selectedDate, setSelectedDate,
    selectedTime, setSelectedTime,
    sessionType, setSessionType,
    scheduling, scheduleError,
    handleAcceptInvitation, handleScheduleSession,
    handleCopyLink, copied,
    // ...any other state/handlers
  } = useInterviewScheduling();
  ```

---

### Example Hook Skeleton

```ts
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { createPracticeRoom } from "@/lib/api";
// import types as needed

export function useInterviewScheduling() {
  // State declarations
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // ...other state

  // Effects for fetching user and sessions
  useEffect(() => {
    // fetch logic here
  }, []);

  // Handlers
  const handleAcceptInvitation = async (sessionId: string) => { /* ... */ };
  const handleScheduleSession = async () => { /* ... */ };
  // ...other handlers

  // Return all state and handlers
  return {
    sessions, loading, error,
    // ...other state and handlers
  };
}
```

---

### Benefits
- Separation of concerns: UI and logic are decoupled.
- Reusability: The hook can be reused in other components if needed.
- Testability: Logic can be unit tested independently of the UI.
- Cleaner main component: Focuses on layout and rendering, not business logic.