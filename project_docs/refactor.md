# Refactor Plan: InterviewScheduling.tsx to Match InterviewPracticeRoom.tsx Structure

## 1. Extract Session Logic to a Custom Hook
- Create a new hook (e.g., `useInterviewScheduling.ts`) in the appropriate directory.
- Move all logic related to:
  - Fetching current user
  - Fetching sessions
  - Scheduling a session
  - Accepting invitations
  - Managing form state (date, time, type)
  - Loading and error states
- The hook should return all state and handlers needed by the main component.

## 2. Panelize the UI
- Create new components in a `panels/` subdirectory:
  - `SessionListPanel.tsx`: Shows available sessions and user's upcoming sessions.
  - `SchedulePanel.tsx`: Contains the scheduling form.
  - `InvitePanel.tsx`: Handles invite link generation and display.
- Each panel receives relevant props from the main component.

## 3. Main Layout Refactor
- Refactor the main component to use a layout similar to `InterviewPracticeRoom.tsx`:
  - Header at the top (title, description)
  - Main content: two columns
    - Left: `SessionListPanel`
    - Right: `SchedulePanel` and `InvitePanel` (stacked or tabbed)
- Remove inline logic/UI for sessions and scheduling from the main file.

## 4. Consistent Naming and Patterns
- Use similar naming conventions for handlers and state as in `InterviewPracticeRoom.tsx`.
- Pass props to panels/components instead of handling everything inline.
- Use `useNavigate` for navigation as needed.

## 5. Optional: Use URL Params or State for Panel/Tab Control
- Optionally, use URL params or local state to control which panel/tab is active, for consistency with how `InterviewPracticeRoom.tsx` uses sessionId from the URL.

## 6. Clean Up and Test
- Remove any unused code from the main file.
- Ensure all props and types are correct.
- Test the refactored component for feature parity and UI consistency.