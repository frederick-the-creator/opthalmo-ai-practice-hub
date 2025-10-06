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
- Status: [ ]
- Owner:
- Backend
  - [ ] Add `ics_sequence INT NOT NULL DEFAULT 0` to `practice_rooms`
  - [ ] Add `duration_minutes INT NOT NULL` (allowed values: 30, 60, 90) and optional `end_utc TIMESTAMP`
  - [ ] Update services to persist `duration_minutes` and compute `end_utc`
  - [ ] Regenerate types using root script (`npm run generate:types`) and commit
- Frontend
  - [ ] Add session length selector and wire to create flow
- Tests/Docs
  - [ ] Unit: validations for duration values
  - [ ] README: note new vars/fields
- Links: PR(s)

### 2) ICS builder: SEQUENCE + DESCRIPTION + duration-aware DTEND
- Status: [ ]
- Owner:
- Backend
  - [ ] Add `SEQUENCE` support to `IcsService`
  - [ ] Use `DTEND = DTSTART + duration_minutes`
  - [ ] Include DESCRIPTION scaffold with reschedule link placeholder
  - [ ] Read/write `ics_sequence` in booking/reschedule/cancel flows
- Frontend
  - [ ] N/A
- Tests
  - [ ] Unit: ICS fields (`UID`, `SEQUENCE`, `DTEND`)
  - [ ] Integration: initial sequence=0, updates increment
- Links: PR(s)

### 3) Booking/Reschedule/Cancel sends with reliability guardrails
- Status: [ ]
- Owner:
- Backend
  - [ ] Idempotency keys `(uid, sequence, attendee_email, method)`
  - [ ] Retries/backoff + structured logs
  - [ ] Ensure MIME parts and attachment naming
  - [ ] Respect flags: `NOTIFICATIONS_ENABLED`, `NOTIFICATIONS_REDIRECT_TO`
- Frontend
  - [ ] Expose in-app reschedule and cancel actions that call existing endpoints and trigger the same ICS flows
  - [ ] Keep success toasts
- Tests
  - [ ] Integration: two REQUEST on first booking; REQUEST updates on reschedule; CANCEL on delete
- Links: PR(s)

### 4) Tokenized reschedule: proposal form (no login) → pending proposal
- Status: [ ]
- Owner:
- Backend
  - [ ] Create `pending_proposals` and `magic_links` tables
  - [ ] Implement token generation/validation (HMAC/JWT)
  - [ ] `GET /reschedule?r=<token>`: validate and render form
  - [ ] `POST /api/reschedule/propose`: persist proposal and notify counterparty
  - [ ] Update ICS DESCRIPTION to include live reschedule URL
- Frontend
  - [ ] Public reschedule form page and success screen
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


