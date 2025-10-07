## Phase 2 Scheduling — Implementation Tracker

- Related PRD: [Phase2_Scheduling_PRD.md](./Phase2_Scheduling_PRD.md)
- Vertical Slices: [Phase2_Scheduling_Implementation_Plan.md](./Phase2_Scheduling_Implementation_Plan.md)
- Last updated: 2025-10-06

Legend
- [ ] Not started
- [x] Done
- [~] In progress
- [!] Blocked

---

### 1) Migrations + Session length selection
- Status: [x]
- Owner:
- Backend
  - [x] Add `ics_sequence INT NOT NULL DEFAULT 0` to `practice_rooms`
  - [x] Add `duration_minutes INT NOT NULL` (allowed values: 30, 60, 90) and optional `end_utc TIMESTAMP` (= `start_utc + duration_minutes`)
  - [x] Add `CHECK (duration_minutes IN (30, 60, 90))` and backfill defaults; compute `end_utc` for legacy rows
  - [x] Update services to persist `duration_minutes` and compute `end_utc`
  - [x] Regenerate types using root script (`npm run generate:types`) and commit
- Frontend
  - [x] Add session length selector and wire to create flow
  - [x] Update lists to display duration
  - [x] Ensure selects include `start_utc`, `duration_minutes`, `end_utc`, `ics_sequence`
- Tests/Docs
  - [x] Unit: validations for duration values (service-level validation)
  - [x] README/PRD notes updated in plan with constraints/backfill and UI display
- Links: PR(s)

### 2) ICS builder: SEQUENCE + DESCRIPTION + duration-aware DTEND
- Status: [x]
- Owner:
- Backend
  - [x] Add `SEQUENCE` support to `IcsService`
  - [x] Use `DTEND = DTSTART + duration_minutes`
  - [x] Include DESCRIPTION scaffold with reschedule link placeholder
  - [x] Read/write `ics_sequence` in booking/reschedule/cancel flows
  - [x] Personalize per-recipient booking titles: "Ophthalmo Practice Session with <first name>"
- Frontend
  - [ ] N/A
- Tests
  - [ ] Unit: ICS fields (`UID`, `SEQUENCE`, `DTEND`)
  - [ ] Integration: initial sequence=0, updates increment
- Links: PR(s)

### 3) Booking/Reschedule/Cancel sends with reliability guardrails
- Status: [~]
- Owner:
- Backend
  - [x] Idempotency keys `(uid, sequence, attendee_email, method)`
  - [x] Retries/backoff + structured logs
  - [x] Ensure MIME parts and attachment naming
  - [x] Respect flags: `NOTIFICATIONS_ENABLED`, `NOTIFICATIONS_REDIRECT_TO`
- Frontend
  - [x] Expose in-app reschedule and cancel actions that call existing endpoints and trigger the same ICS flows
  - [x] Keep success toasts
- Tests
  - [ ] Integration: two REQUEST on first booking; REQUEST updates on reschedule; CANCEL on delete
- Links: PR(s)

### 4) Tokenized reschedule: proposal form (no login) → pending proposal
- Status: [x]
- Owner:
- Backend
  - [x] Create `pending_proposals` and `magic_links` tables
  - [x] Implement token generation/validation (HMAC/JWT)
  - [x] `GET /reschedule?r=<token>`: validate and render form
  - [x] `POST /api/reschedule/propose`: persist proposal and notify counterparty
  - [x] Update ICS DESCRIPTION to include live reschedule URL
- Frontend
  - [x] Public reschedule form page and success screen
- Tests
  - [ ] Unit: token validation and proposal persistence
  - [ ] Integration: proposal happy path
- Links: PR(s)

### 5) Approve/Decline magic links → apply or reject proposal
- Status: [ ]
- Owner:
- Backend
  - [ ] `GET /approve?t=<token>`: apply update, bump sequence, send REQUEST updates
  - [ ] `GET /decline?t=<token>`: mark declined, courtesy email
  - [ ] Idempotency on double-approve / sequence already advanced
- Frontend
  - [ ] Public confirmation pages for approve/decline outcomes
- Tests
  - [ ] Integration: approval updates time and emails both; decline no change
- Links: PR(s)

### 6) Inbound iMIP — REPLY accept/decline with Strict Cancel policy
- Status: [ ]
- Owner:
- Backend
  - [ ] Ingest REPLY (ACCEPTED/DECLINED), persist `imip_messages`
  - [ ] Strict cancel: guest declines → unbook + targeted CANCEL; host declines → CANCEL to guest then delete room
  - [ ] Dedupe by Message-ID and `(uid, method, sequence)`
- Frontend
  - [ ] N/A
- Tests
  - [ ] Integration: REPLY paths trigger correct operations and sends
- Links: PR(s)

### 7) Inbound iMIP — COUNTER → proposal + approval flow
- Status: [ ]
- Owner:
- Backend
  - [ ] Parse COUNTER, create proposal, send Approve/Decline links
  - [ ] Approve → REQUEST updates with sequence bump; Decline → no change
- Frontend
  - [ ] N/A
- Tests
  - [ ] Integration: COUNTER round-trip success
- Links: PR(s)

### 8) Reliability, idempotency, deliverability, observability
- Status: [ ]
- Owner:
- Backend
  - [ ] Retries/backoff on mail; structured logs with correlation IDs
  - [ ] Idempotency keys enforced across sends and decisions
  - [ ] Optional `POST /api/hooks/email-status` for provider status
  - [ ] Metrics: sends, replies parsed, proposals, approvals, declines, bounces
- Frontend
  - [ ] N/A
- Tests/Docs
  - [ ] Operational playbooks and dashboards
- Links: PR(s)

### 9) Backfill + compatibility
- Status: [ ]
- Owner:
- Backend
  - [ ] Backfill `ics_sequence=0` and default `duration_minutes` for legacy rows
  - [ ] Compute `end_utc` where applicable
  - [ ] Guard services for legacy events
- Frontend
  - [ ] Ensure lists render with defaults
- Tests
  - [ ] Integration: legacy room reschedule/cancel behaves correctly
- Links: PR(s)

### 10) Templates, UX polish, and time zones
- Status: [ ]
- Owner:
- Backend
  - [ ] Email subjects/bodies per PRD; friendly local time hints
  - [ ] Keep ICS UTC (no VTIMEZONE) unless decision changes
- Frontend
  - [ ] Public pages copy/accessibility polish
- Tests/Docs
  - [ ] Content review; accessibility check
- Links: PR(s)

---

Backlog / Nice-to-haves
- [ ] Reminder emails
- [ ] Soft-decline policy support (track without operational cancel)
- [ ] Calendar VTIMEZONE emission for richer client rendering


