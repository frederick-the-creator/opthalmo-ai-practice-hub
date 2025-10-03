## Phase 1 Scheduling — Implementation Tracker

- Related PRD: [Combined_PRD_Scheduling_MVP_and_Google_Integration.docx.md](./Combined_PRD_Scheduling_MVP_and_Google_Integration.docx.md)
- Vertical Slices: [Phase1_Scheduling_Vertical_Slices.md](./Phase1_Scheduling_Vertical_Slices.md)
- Last updated: 2025-10-03

Legend
- [ ] Not started
- [x] Done
- [~] In progress
- [!] Blocked

---

### 1) Create scheduled room (no email yet)
- Status: [x]
- Owner:
- Backend
  - [x] POST `/api/practice-room/create` inserts room + first round
  - [x] Persist `ics_uid` on create
- Frontend
  - [x] `InterviewScheduling.tsx` lists created sessions
  - [x] `useInterviewScheduling.ts` supports `createRoom`
  - [x] Realtime list via `subscribeToAllPracticeRooms()`
- Tests/Docs
  - [ ] Unit: service/repository insert path
  - [x] Integration: create returns room with `ics_uid`
  - [ ] Update README envs if needed
- Links: PR(s)

### 2) Book an open session (guarded, no email yet)
- Status: [x]
- Owner:
- Backend
  - [x] POST `/api/practice-room/update` sets `guest_id` if null
  - [x] Return 409 if already booked; prevent host booking
- Frontend
  - [x] "Book" action for non-host when `guest_id` is null
  - [x] Handle 409 with toast; realtime reflects booking
- Tests/Docs
  - [ ] Unit: booking guard logic
  - [ ] Integration: first booking ok, second 409
- Links: PR(s)

### 3) Reschedule a session (no email yet)
- Status: [x]
- Owner:
- Backend
  - [x] Allow `datetime_utc` update; validate future timestamp
- Frontend
  - [x] Host reschedule control; optimistic UI
  - [x] Realtime updates across clients
- Tests/Docs
  - [ ] Unit: date validation
  - [ ] Integration: reschedule reflects in reads/realtime
- Links: PR(s)

### 4) Cancel (delete) a session (no email yet)
 - Status: [x]
- Owner:
- Backend
  - [x] DELETE `/api/practice-room/:roomId`
  - [x] Delete `practice_rounds` then `practice_rooms`
- Frontend
  - [x] Confirm + delete action; realtime removal
- Tests/Docs
  - [ ] Integration: delete removes dependent rows
- Links: PR(s)

### 5) ICS + Notification infrastructure (dark launch)
- Status: [ ]
- Owner:
- Backend
  - [ ] `services/ics.ts` — `buildIcs(...)`
  - [ ] `services/notification.ts` — provider-agnostic; dry-run logging
  - [ ] Supabase Admin client to resolve emails by `user_id`
  - [ ] Wire dry-run calls on booking/reschedule/delete paths
- Config/Docs
  - [ ] `NOTIFICATIONS_ENABLED=false` in lower envs
  - [ ] README: provider keys, `SUPABASE_SERVICE_ROLE_KEY`
- Tests
  - [ ] Unit: ICS fields, deterministic UID usage
- Links: PR(s)

### 6) Booking emails (REQUEST)
- Status: [ ]
- Owner:
- Backend
  - [ ] Detect `guest_id: null → uuid` and send METHOD:REQUEST to host + guest
  - [ ] Retries with logging; stable `UID`
- Frontend
  - [ ] Success toast mentions calendar invite
- Tests
  - [ ] Integration: two emails on first booking; none on 409
- Links: PR(s)

### 7) Reschedule emails (REQUEST update)
- Status: [ ]
- Owner:
- Backend
  - [ ] Detect `datetime_utc` change and send METHOD:REQUEST with same `UID`
- Frontend
  - [ ] Success toast mentions updated invite
- Tests
  - [ ] Integration: both parties receive updated ICS
- Links: PR(s)

### 8) Cancel emails (CANCEL)
- Status: [ ]
- Owner:
- Backend
  - [ ] In DELETE path, send METHOD:CANCEL to host (+ guest if exists) pre-delete
  - [ ] Delete rounds then room
- Frontend
  - [ ] Success toast mentions cancellation sent
- Tests
  - [ ] Integration: CANCEL sent and rows deleted afterwards
- Links: PR(s)

### 9) Hardening, observability, docs
- Status: [ ]
- Owner:
- Backend
  - [ ] Structured logs for notifications; retries/backoff
  - [ ] Correct HTTP codes (200/400/409/500)
- Frontend
  - [ ] Disable controls during requests; consistent toasts
- Docs/QA
  - [ ] Test plan documented; acceptance criteria mapped
- Links: PR(s)

---

Backlog / Nice-to-haves
- [ ] Reminder emails (deferred)
- [ ] Link tracker to PR automation (badges/status)
