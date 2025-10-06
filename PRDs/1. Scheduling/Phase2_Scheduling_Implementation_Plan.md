## Phase 2 — Hybrid Scheduling (ICS + Tokenized Approvals, Central Organizer)

This plan translates the Phase 2 PRD into vertical slices (user stories) that deliver incremental value. Each slice specifies Backend, Frontend, and Acceptance criteria. It follows the structure used in Phase 1.

Related PRD: [Phase2_Scheduling_PRD.md](./Phase2_Scheduling_PRD.md)

---

### 1) Migrations + Session length selection
- **User story**: As a host, I can pick a session length (30/60/90 mins) when creating a room, and invites later reflect that duration.
- **Backend**
  - Add DB columns on `practice_rooms`:
    - `ics_sequence INT NOT NULL DEFAULT 0`
    - `duration_minutes INT NOT NULL` (required; validate allowed values: 30, 60, 90)
    - `end_utc TIMESTAMP` (optional denormalization = `start_utc + duration_minutes`)
  - Constraints and data hygiene:
    - Add `CHECK (duration_minutes IN (30, 60, 90))`.
    - Backfill legacy rows: set `duration_minutes = 60` where null; compute `end_utc` where `start_utc` present (legacy rows may still have `datetime_utc`).
  - Types: update `apps/backend/types/database.types.ts` and shared domain types (`apps/backend/types/index.ts`).
  - Services: update `createPracticeRoom(...)` to accept `startUtc` and persist `duration_minutes`; compute and persist `end_utc` if present.
  - Regenerate TS DB types using the root script: `npm run generate:types`.
- **Frontend**
  - Add session length selector to host room creation UI (`InterviewScheduling.tsx` / hook) and pass `durationMinutes` in create request.
  - Update frontend domain types (`apps/frontend/src/types/index.ts`) as needed.
  - Ensure Supabase selects include `duration_minutes`, `end_utc`, and `ics_sequence` in `practice_rooms` fetches.
  - Display the chosen duration in the scheduling lists (`RoomListPanel.tsx`).
- **Acceptance**
  - Room creation persists `duration_minutes` (and `end_utc` if present) with valid values only.
  - Lists and details load without regressions and show the session duration.

### 2) ICS builder: SEQUENCE + DESCRIPTION + duration-aware DTEND
- **User story**: As an attendee, my calendar invite includes the correct end time and is ready for future updates via `SEQUENCE`.
- **Backend**
  - Extend `IcsService` (`apps/backend/services/notifications/icsBuilder.ts`) to include:
    - `SEQUENCE` (int; start at 0 for initial, increment for updates)
    - `DTEND = DTSTART + duration_minutes`
    - `DESCRIPTION` scaffold with human text and a placeholder for a reschedule link (actual tokenized link added in Slice 4).
    - Per-recipient `SUMMARY`/email subject personalization for booking REQUESTs: "Ophthalmo Practice Session with <first name>" where the first name is the counterparty.
  - Ensure per-recipient, single `ATTENDEE`, stable `UID = practice_rooms.ics_uid`, `ORGANIZER` from env.
  - Wire `ics_sequence` read/write in `practiceRoom` service for booking/update/cancel flows (increment only on REQUEST updates).
- **Frontend**
  - No UI changes required.
- **Acceptance**
  - ICS for booking/reschedule/cancel contains `UID`, `SEQUENCE`, and duration-aware `DTEND`.
  - `SEQUENCE` remains 0 on initial sends and increments by 1 on each REQUEST update.
  - Invite title is personalized per recipient on booking as "Ophthalmo Practice Session with <first name>".

### 3) Booking/Reschedule/Cancel sends with reliability guardrails
- **User story**: As an attendee, I reliably receive invites/updates/cancels with correct metadata.
- **Backend**
  - Harden `NotificationService`:
    - Add idempotency keys `(uid, sequence, attendee_email, method)` to prevent duplicate sends.
    - Retries with exponential backoff on transient provider errors; structured logs.
    - Ensure MIME parts: `text/plain` (or html), `text/calendar; method=REQUEST|CANCEL`, attachment `invite.ics`.
    - Respect `NOTIFICATIONS_ENABLED` and `NOTIFICATIONS_REDIRECT_TO`.
  - Send policies (unchanged from Phase 1 semantics, but with SEQUENCE):
    - Booking (guest added): send REQUEST to host and guest (sequence 0).
    - Reschedule (host changes time): send REQUEST updates (sequence += 1) only if a guest is booked.
    - Cancel (delete): send CANCEL to host (+guest if booked) with same UID.
- **Frontend**
  - Expose in-app reschedule and cancel actions calling existing endpoints; these trigger the same ICS flows (REQUEST updates with sequence bump, or CANCEL).
  - Keep success toasts; no changes.
- **Acceptance**
  - Two REQUEST emails on first booking; updated REQUESTs on reschedule; CANCEL on delete (if booked); all with stable UID and correct sequence.

### 4) Tokenized reschedule: proposal form (no login) → pending proposal
- **User story**: As an attendee, I can click a Reschedule link in the invite, open a no-login form, and propose a new time.
- **Backend**
  - Data model additions:
    - `pending_proposals(id, room_id, uid, proposed_by, proposer_email, proposed_start_utc, proposed_end_utc, note, status, created_at, expires_at, approved_by, decision_at)`
    - `magic_links(id, purpose, uid, room_id, actor_email, actor_role, token_hash, expires_at, used_at)`
  - `ProposalService`:
    - Generate signed tokens (HMAC/JWT) bound to `{uid, role, email}` with expiry.
    - Create and persist `pending_proposals` on propose.
    - Send informational email to counterparty acknowledging a proposal exists (no approval links yet).
  - Endpoints:
    - `GET  /reschedule?r=<token>` — Render form (SSR or minimal static) after token validation.
    - `POST /api/reschedule/propose` — `{ token, proposedStartUtc, proposedEndUtc, note }` → create `pending_proposal`.
  - Update ICS `DESCRIPTION` to include working tokenized Reschedule URL.
- **Frontend**
  - Minimal pages/forms (public, no login): reschedule form page that posts proposal.
  - Friendly success screen after submit.
- **Acceptance**
  - Valid token opens form; invalid/expired token shows error with restart guidance.
  - Submitting a valid proposal creates a `pending_proposals` record and emails the counterparty notification.

### 5) Approve/Decline magic links → apply or reject proposal
- **User story**: As the counterparty, I can approve or decline a proposed new time via one-click magic links.
- **Backend**
  - Extend `ProposalService` to issue Approve/Decline tokens and emails.
  - Endpoints:
    - `GET /approve?t=<token>` — Validate, update room times, bump `ics_sequence`, send two REQUEST updates (sequence += 1), mark proposal approved, mark token used.
    - `GET /decline?t=<token>` — Validate, mark proposal declined; optional courtesy email to proposer.
  - Idempotency: If `ics_sequence` already advanced, return success and mark token used (no duplicate sends).
- **Frontend**
  - Minimal public confirmation pages for approve/decline outcomes.
- **Acceptance**
  - Approval updates room time, increments sequence, and delivers updated ICS to both attendees.
  - Decline records properly and does not change the event.

### 6) Inbound iMIP — REPLY accept/decline with Strict Cancel policy
- **User story**: As an admin/system, attendee acceptances/declines from calendar are ingested and applied per policy.
- **Backend**
  - `IMipIngestor` to parse inbound `text/calendar` (webhook or IMAP poller): persist `imip_messages(uid, method, sequence, attendee_email, partstat, raw_pointer, received_at)`.
  - `METHOD:REPLY`:
    - `ACCEPTED` → record acceptance per-attendee.
    - `DECLINED` → Strict policy: if guest declines, unbook guest and send targeted CANCEL to guest; notify host. If host declines, send CANCEL to guest (if booked) and delete room.
  - Dedupe by provider `Message-ID` and `(uid, method, sequence)`.
- **Frontend**
  - No changes required.
- **Acceptance**
  - Valid REPLYs update internal state and trigger correct CANCEL behaviors.

### 7) Inbound iMIP — COUNTER → proposal + approval flow
- **User story**: When an attendee COUNTERs with a new time from their calendar, it creates a proposal that can be approved/declined by the other party.
- **Backend**
  - `METHOD:COUNTER` → create `pending_proposal` and send Approve/Decline magic links to counterparty.
  - On approval, same behavior as Slice 5 (REQUEST updates with sequence bump). On decline, no event change.
- **Frontend**
  - No changes required.
- **Acceptance**
  - COUNTER messages result in actionable proposals; approvals apply updates idempotently.

### 8) Reliability, idempotency, deliverability, observability
- **User story**: As an operator, I can trust delivery and diagnose issues quickly.
- **Backend**
  - Retries with backoff on outbound mail; centralized structured logs with correlation IDs (`uid`, `sequence`).
  - Idempotency keys enforced for sends and proposal decisions.
  - Optional `POST /api/hooks/email-status` for provider delivery/bounce tracking.
  - Metrics: counts for sends, replies parsed, proposals created, approvals, declines, bounces.
- **Frontend**
  - N/A.
- **Acceptance**
  - Duplicate send attempts are deduped; logs/metrics expose lifecycle events.

### 9) Backfill + compatibility
- **User story**: Existing rooms continue to work under Phase 2.
- **Backend**
  - Backfill `ics_sequence=0` where null; set default `duration_minutes` (e.g., 60) for legacy rows; compute `end_utc` if present.
  - Guard legacy events in services to prevent undefined sequence usage.
- **Frontend**
  - Ensure lists render with defaulted `duration_minutes` for older rooms.
- **Acceptance**
  - Legacy rooms can be rescheduled and cancelled with correct ICS semantics.

### 10) Templates, UX polish, and time zones
- **User story**: Emails are clear and friendly; times are understandable.
- **Backend**
  - Email templates: Invite/Update/Cancel subjects from PRD; human body includes local time hints alongside UTC.
  - Keep ICS in UTC for simplicity (no VTIMEZONE), unless later decision changes this.
- **Frontend**
  - Public pages improved copy, error states, and accessibility.
- **Acceptance**
  - Email bodies render friendly text with links; public pages are accessible and branded.

---

## Cross-Cutting Notes
- **Privacy**: Always send two single-attendee ICS messages; never reveal the other attendee’s email.
- **Organizer**: Central organizer mailbox from `NOTIFICATIONS_FROM_EMAIL`.
- **Security**: Short-lived, single-use tokens; audit all actions; reject tokens on reuse/expiry.
- **Types**: Prefer shared domain types (`apps/backend/types/index.ts`, `apps/frontend/src/types/index.ts`).
- **Errors**: Use `HttpError` utilities and map frontend errors with `mapApiError` contexts (`'booking' | 'reschedule' | 'cancel' | 'round' | 'recording' | 'assessment' | 'profile' | 'generic'`).
- **DB Types**: After migrations, run `npm run generate:types` and commit both frontend and backend generated files.

---

## Test & Docs (for the phase overall)
- Unit: ICS builder (`SEQUENCE`, `DTEND`, escaping); ProposalService token validation; IMipIngestor parsing.
- Integration: Booking → initial REQUEST; Reschedule → REQUEST update with sequence bump; Cancel → CANCEL; Proposal approve/decline; iMIP REPLY and COUNTER flows.
- E2E: Happy path with propose/approve via public links.
- Docs: Update backend README with envs (`NOTIFICATIONS_ENABLED`, `NOTIFICATIONS_FROM_EMAIL`, provider keys, token secret, webhook/IMAP config) and operational playbooks.


