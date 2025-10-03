## Vertical Slices (User Stories) for Phase 1 Scheduling

### 1) Create scheduled room (no email yet)
- **User story**: As a host, I can create a scheduled practice room for a future time so I can plan a session.
- **Backend**
  - Ensure POST `/api/practice-room/create` works end-to-end via `createPracticeRoom(...)` with `practice_rounds` seed.
  - Generate and persist `ics_uid` (UUID v4) on create via `createRoomWithReturn`.
- **Frontend**
  - `InterviewScheduling.tsx` shows created sessions; `createRoom` flow in `useInterviewScheduling.ts`.
  - Realtime list updates via `subscribeToAllPracticeRooms()`.
- **Acceptance**
  - Room created with `datetime_utc`, `private`, `room_url`, `ics_uid`.
  - No ICS/email sent on creation.
  - Session appears in list immediately.

### 2) Book an open session (guard against overwrite, no email yet)
- **User story**: As a guest (non-host), I can book an open session, and the UI updates live.
- **Backend**
  - POST `/api/practice-room/update` detects and guards booking: if `guest_id` already set, return 409; else set `guest_id`.
  - Authorization: request user cannot be the host for booking.
- **Frontend**
  - “Book” button only when `guest_id` is null (non-host).
  - `setRoomGuest({ roomId, guestId })` via `useInterviewScheduling.ts`; handle 409 with toast.
  - Realtime reflects booking state.
- **Acceptance**
  - First booking succeeds; second attempt receives 409.
  - Host cannot book own session.
  - No ICS/email sent yet.

### 3) Reschedule a session (no email yet)
- **User story**: As a host, I can reschedule a session by changing `datetime_utc`.
- **Backend**
  - POST `/api/practice-room/update` allows `datetime_utc` update; validate future timestamp.
- **Frontend**
  - Reschedule control for host in `InterviewScheduling.tsx`; optimistic update with revert on error.
  - Realtime updates across clients.
- **Acceptance**
  - Valid reschedules succeed; invalid dates rejected.
  - No ICS/email sent yet.

### 4) Cancel (delete) a session (no email yet)
- **User story**: As a host, I can cancel a session and it disappears from lists.
- **Backend**
  - New `DELETE /api/practice-room/:roomId`: delete `practice_rounds` then `practice_rooms`.
  - Load room prior to delete to return a useful response (who would have been notified later).
- **Frontend**
  - “Delete” action with confirm dialog; calls `deleteRoom(roomId)` added to `apps/frontend/src/lib/api.ts` and `useInterviewScheduling.ts`.
  - Realtime removes the room from lists.
- **Acceptance**
  - Room and rounds removed; 404 if already deleted.
  - No ICS/email sent yet.

### 5) ICS + Notification infrastructure (dark launch)
- **User story**: As an operator, I can generate ICS payloads and simulate email sends in logs without contacting users.
- **Backend**
  - New `services/ics.ts`: `buildIcs({ uid, method, startUtc, endUtc, summary, organizer, attendees, status })`.
  - New `services/notification.ts`: provider-agnostic; implement “dry-run” logging behind `NOTIFICATIONS_ENABLED=false`.
  - Admin Supabase client in `utils/supabase.ts` to resolve host/guest emails by `user_id`.
- **Acceptance**
  - Booking/reschedule/delete paths call notification layer in dry-run mode and log payloads.
  - No actual emails sent while `NOTIFICATIONS_ENABLED=false`.

### 6) Booking emails (REQUEST) enabled
- **User story**: As a host and guest, when a session is booked I receive an Email/ICS invite.
- **Backend**
  - On `guest_id: null → uuid`, send ICS METHOD:REQUEST to both emails (stable `ics_uid`).
  - Use Admin client to fetch emails; include `UID`, `DTSTART/DTEND` UTC, `ORGANIZER`, both `ATTENDEE`s.
  - Add basic retries and log outcomes.
- **Frontend**
  - Booking success toast mentions “calendar invite will arrive by email.”
- **Acceptance**
  - First booking triggers two emails; second booking attempt returns 409 and no email.
  - Logged attempts include room id and `ics_uid`.

### 7) Reschedule emails (REQUEST update)
- **User story**: As a host and guest, when a session time changes I receive an updated Email/ICS.
- **Backend**
  - Detect `datetime_utc` change and send METHOD:REQUEST with same `UID`.
- **Frontend**
  - Reschedule success toast mentions updated invite.
- **Acceptance**
  - Both parties receive updated ICS with same `UID`; invalid date changes produce no email.

### 8) Cancel emails (CANCEL)
- **User story**: As a host and guest, when a session is deleted I receive a cancellation Email/ICS.
- **Backend**
  - In DELETE route, before deletion, send METHOD:CANCEL to host and (if exists) guest with same `UID`.
  - Then delete `practice_rounds` followed by `practice_rooms`.
- **Frontend**
  - Delete success toast mentions cancellation sent.
- **Acceptance**
  - CANCEL sent to host and guest (guest only if present); rows deleted afterwards.

### 9) Hardening, observability, docs
- **User story**: As an operator, I can monitor notifications and troubleshoot issues; as a developer, I have clear env and test docs.
- **Backend**
  - Structured logs for each notification attempt; retries with backoff; meaningful HTTP codes (200/400/409/500).
- **Frontend**
  - Consistent error toasts; disable controls during requests.
- **Docs/Tests**
  - README: envs (`SUPABASE_SERVICE_ROLE_KEY`, email provider key, `NOTIFICATIONS_ENABLED`).
  - Unit: ICS builder fields; update-flow detectors.
  - Integration: full lifecycle; E2E happy path.
- **Acceptance**
  - Meets PRD Phase 1 acceptance criteria; test plan documented.

## Cross-Cutting Notes
- **Data**: Add `practice_rooms.ics_uid` once in Slice 1 and persist at create; backfill lazily on first send if missing (log warning).
- **Flags**: `NOTIFICATIONS_ENABLED` to turn on real sends starting Slice 6; keep dry-run logs in lower envs.
- **Realtime**: Continue using `subscribeToAllPracticeRooms()` and `subscribeToPracticeRoomByRoomId({ roomId })` throughout.
