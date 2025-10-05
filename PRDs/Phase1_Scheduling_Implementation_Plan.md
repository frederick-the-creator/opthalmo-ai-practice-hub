## Vertical Slices (User Stories) for Phase 1 Scheduling

### 1) Create scheduled room (no email yet)
- **User story**: As a host, I can create a scheduled practice room for a future time so I can plan a session.
- **Backend**
  - POST `/api/practice-room/create` → service `createPracticeRoom(...)` provisions a Daily.co room and inserts into `practice_rooms`, then seeds first `practice_rounds` with `round_number = 1`.
  - `ics_uid` is generated as a UUID v4 and persisted at create via repository `createRoomWithReturn`.
  - Typical errors: 401 (missing/invalid token), 500 (Daily or DB error). No ICS/email is sent on creation.
- **Frontend**
  - `InterviewScheduling.tsx` uses `useInterviewScheduling()`; `handleScheduleRoom` converts local date/time to UTC (`toISOString`) and calls `createRoom` in `apps/frontend/src/lib/api.ts`.
  - List updates live via `subscribeToAllPracticeRooms()`; reads join host/guest profiles for display.
  - List filters out sessions >1 hour past start time.
- **Acceptance**
  - Room created with fields: `datetime_utc`, `private`, `room_url`, `ics_uid`, `stage: "Prep"`.
  - No ICS/email sent on creation.
  - Session appears in list immediately via realtime.

### 2) Book an open session (guard against overwrite, no email yet)
- **User story**: As a guest (non-host), I can book an open session, and the UI updates live.
- **Backend**
  - POST `/api/practice-room/update` with `{ roomId, guestId: <currentUser> }` applies booking guards in service:
    - 403: host cannot book own session.
    - 403: requester can only book themselves as guest.
    - 409: if `guest_id` already set, do not overwrite.
  - On first successful booking, service triggers ICS `METHOD: REQUEST` send; emails are gated by `NOTIFICATIONS_ENABLED` and will be dry-run logged when disabled.
  - ICS policy: send separate emails to host and guest; each ICS includes only that recipient as ATTENDEE; ORGANIZER derived from `NOTIFICATIONS_FROM_EMAIL`.
- **Frontend**
  - “Accept Invitation” button is shown for non-hosts on public rooms and disabled when a guest is already present.
  - `handleAcceptInvitation` calls `setRoomGuest({ roomId, guestId: user.id })` and shows success toast mentioning the calendar invite; errors mapped via `mapApiError(err, 'booking')` (409, 403, etc.).
  - Realtime updates reflect booking state for all viewers.
- **Acceptance**
  - First booking succeeds; second attempt returns 409.
  - Host cannot book own session (403).
  - ICS/email attempts occur only when emails are enabled; otherwise logged (dry-run).

### 3) Reschedule a session (no email yet)
- **User story**: As a host, I can reschedule a session by changing `datetime_utc`.
- **Backend**
  - POST `/api/practice-room/update` with `{ roomId, datetimeUtc }` validates:
    - Only host can reschedule (403 if not host).
    - `datetimeUtc` must be a valid future timestamp (400 on invalid/past).
  - On change, service triggers ICS `METHOD: REQUEST` update only if a guest is already booked; gated by `NOTIFICATIONS_ENABLED` (dry-run when disabled).
- **Frontend**
  - Host-only “Reschedule” opens date/time dialog; optimistic update of local list then calls `rescheduleRoom`.
  - On error, revert by refetching; success toast mentions updated invite; realtime sync updates others.
- **Acceptance**
  - Valid reschedules succeed; invalid/past dates rejected with 400.
  - ICS/email attempts occur only when enabled; otherwise logged.

### 4) Cancel (delete) a session (no email yet)
- **User story**: As a host, I can cancel a session and it disappears from lists.
- **Backend**
  - `DELETE /api/practice-room/:roomId` guarded by host ownership.
  - Sends ICS `METHOD: CANCEL` only if a guest had booked; then deletes dependent `practice_rounds` followed by the `practice_rooms` row.
  - If the room does not exist, returns 404. Other errors map to 403/500 appropriately.
- **Frontend**
  - “Cancel” with confirm dialog; optimistic removal from list; calls `cancelRoom(roomId)`; success toast mentions cancellation; realtime removes for others.
- **Acceptance**
  - If booked: CANCEL is attempted (or dry-run logged) and rows are deleted afterwards.
  - If unbooked: no CANCEL is sent; rows are deleted.
  - 404 when deleting a non-existent room.

### 5) ICS + Notification infrastructure (dark launch)
- **User story**: As an operator, I can generate ICS payloads and simulate email sends in logs without contacting users.
- **Backend**
  - `services/notification.ts` implements:
    - `buildIcs({ uid, method, startUtc, endUtc, summary, organizer, attendees, status })` with VCALENDAR/VEVENT lines, UTC timestamps, and escaped text fields.
    - Provider-agnostic `sendNotification` with retries/backoff; dry-run logging when `NOTIFICATIONS_ENABLED=false` (default).
    - Resend provider used when enabled; supports `NOTIFICATIONS_REDIRECT_TO` for dev routing.
    - Admin Supabase client resolves host/guest emails via `auth.admin.getUserById`.
  - Booking/reschedule/delete paths call the notification layer as per triggers above.
- **Acceptance**
  - With `NOTIFICATIONS_ENABLED=false`, all attempts are logged (no emails sent).
  - ICS attachments include per-recipient ATTENDEE only; ORGANIZER from `NOTIFICATIONS_FROM_EMAIL`.

### 6) Booking emails (REQUEST) enabled
- **User story**: As a host and guest, when a session is booked I receive an Email/ICS invite.
- **Backend**
  - When `guest_id` transitions from null → value, send `METHOD: REQUEST` to host and guest separately with stable `UID = ics_uid`.
  - Privacy: per-recipient ICS lists only that attendee; ORGANIZER from env.
  - Retries/backoff with logs; Resend provider behind `NOTIFICATIONS_ENABLED=true` (optional redirect).
- **Frontend**
  - Booking success toast indicates a calendar invite will arrive by email.
- **Acceptance**
  - First booking triggers two sends; subsequent attempt returns 409 and no email.

### 7) Reschedule emails (REQUEST update)
- **User story**: As a host and guest, when a session time changes I receive an updated Email/ICS.
- **Backend**
  - On `datetime_utc` change, send `METHOD: REQUEST` update with same `UID`; send only if a guest is booked.
- **Frontend**
  - Reschedule success toast mentions updated invite.
- **Acceptance**
  - Both parties receive updated ICS with same `UID` when enabled; invalid date changes produce 400 and no email attempt.

### 8) Cancel emails (CANCEL)
- **User story**: As a host and guest, when a session is deleted I receive a cancellation Email/ICS.
- **Backend**
  - In DELETE path, before deletion, send `METHOD: CANCEL` to host (+guest if present) with same `UID`.
  - Skip CANCEL if no guest is booked. Then delete rounds followed by the room.
- **Frontend**
  - Delete success toast mentions cancellation sent.
- **Acceptance**
  - CANCEL attempted for booked sessions; rows deleted afterwards. 404 for non-existent room.

### 9) Hardening, observability, docs
- **User story**: As an operator, I can monitor notifications and troubleshoot issues; as a developer, I have clear env and test docs.
- **Backend**
  - Logs on each notification attempt; retries with exponential backoff; HTTP codes surfaced via `HttpError` (400/401/403/404/409/500).
- **Frontend**
  - Consistent error toasts via `mapApiError`; controls disabled during requests where appropriate.
- **Docs/Tests**
  - README: envs (`SUPABASE_SECRET_KEY`, `NOTIFICATIONS_FROM_EMAIL`, provider key, `NOTIFICATIONS_ENABLED`, optional `NOTIFICATIONS_REDIRECT_TO`).
  - Unit: ICS builder fields; booking/reschedule/cancel triggers; 404 delete behavior.
  - Integration: full lifecycle; E2E happy path.
- **Acceptance**
  - Meets PRD Phase 1 acceptance criteria; test plan documented.

## Cross-Cutting Notes
- **Data**:
  - `practice_rooms.ics_uid` is set on create and used as stable ICS UID.
  - If `ics_uid` were missing, current implementation uses an ephemeral fallback (`ephemeral-<roomId>`) for logging only; consider backfilling and persisting a UUID on first send as a future improvement.
- **HTTP semantics**:
  - DELETE returns 404 for non-existent rooms; other errors map to 401/403/409/500 consistently across routes.
- **Flags**:
  - `NOTIFICATIONS_ENABLED` gates real sends; keep it false in lower envs to use dry-run logs. `NOTIFICATIONS_REDIRECT_TO` can route all emails to a tester.
- **Realtime**:
  - Continue using `subscribeToAllPracticeRooms()` and `subscribeToPracticeRoomByRoomId({ roomId })` throughout for live updates.
