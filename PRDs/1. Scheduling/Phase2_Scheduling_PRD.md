# PRD — Hybrid Scheduling (ICS + Tokenized Approvals, Central Organizer)

## 0. Executive Summary
We will deliver a privacy-preserving scheduling flow using standard iCalendar (ICS/iTIP over email) plus a universal “Request new time” link. The central organizer (a single mailbox controlled by us) sends **two separate single-attendee invites** with the same UID to host and guest so they don’t see each other’s email. Attendees can accept/decline from their own calendar apps. For rescheduling, we support (a) native iTIP COUNTER where available and (b) a tokenized email/web link that lets either party request a new time and the other party approve or decline **without logging in**. On approval, both attendees receive an updated ICS; on decline, no change (or cancel, per policy).

## 0.a Current Implementation Baseline (Phase 1)
- The application already implements scheduling and booking per `USER_FLOW_SCHEDULING` with these behaviors:
  - A room is created via POST `/api/practice-room/create`, provisioning a Daily.co room and persisting `practice_rooms` with a stable `ics_uid` (UUID v4) and `start_utc` (formerly `datetime_utc`); an initial `practice_rounds` row is also created.
  - Booking happens via POST `/api/practice-room/update` with `{ roomId, guestId: <currentUser> }`. Guards prevent host self-booking, enforce self-booking, and block overwrites if already booked.
  - Reschedule happens via POST `/api/practice-room/update` with `{ roomId, startUtc }` (formerly `{ roomId, startUtc }`); guards ensure host-only and future timestamp.
  - Delete happens via DELETE `/api/practice-room/:roomId`; host-only, deletes dependent rounds first.
- Notification/ICS (feature-gated):
  - On first successful booking, the backend attempts to send ICS `METHOD: REQUEST` to host and guest, as two separate single-attendee ICS emails. On reschedule, `REQUEST` is sent only if a guest is booked. On delete (if booked), `CANCEL` is sent.
  - Organizer is derived from `NOTIFICATIONS_FROM_EMAIL`.
  - When `NOTIFICATIONS_ENABLED=false` (default), the system does a dry-run log; no emails are sent.
  - ICS currently includes `METHOD`, `UID` (from `practice_rooms.ics_uid`), `DTSTAMP`, `DTSTART/DTEND` (UTC, 1h duration inferred), `SUMMARY`, `ORGANIZER`, a single `ATTENDEE`, `STATUS`. It does not yet include `SEQUENCE`, and DESCRIPTION does not yet include reschedule links.

## 1. Objectives
- Let hosts create sessions and guests book them.
- Keep emails private between participants.
- Let participants manage entirely from their calendar/email (accept/decline/cancel/reschedule).
- Provide a universal rescheduling path that works even when the calendar client doesn’t support iTIP `COUNTER`.
- Maintain a clean seam to swap in/out Google/Microsoft later without refactoring the core product.

## 2. Scope
**In scope**
- Central organizer mailbox (e.g., `scheduling@yourdomain.com`).
- ICS send: REQUEST/UPDATE/CANCEL as **two single-attendee** messages (same `UID`).
- Inbound iMIP processing: parse REPLY (accept/decline) and COUNTER (if present).
- Tokenized flow: “Request new time” link, plus approval/decline magic links for the counterparty.
- Minimal web pages:
  - Reschedule proposal form (no login; tokenized)
  - Approve/Decline actions (one-click; tokenized)
- Deliverability & retries; idempotent send/update/cancel.

**Out of scope (this phase)**
- Native Google/Microsoft Calendar APIs.
- Availability slot marketplace (that is a separate phase).
- In-app calendar UI (only minimal pages for proposal/approval).

Note on current baseline: The backend already sends ICS on booking/reschedule/delete (when booked) behind a feature flag; inbound iMIP and tokenized pages are not yet implemented.

## 3. User Stories
- **As a host**, I receive an invite via email, add it to my calendar, and can accept/decline. If I need a different time, I click “Request new time” in the invite and propose a new time; the guest gets an approval email; on approval, my calendar updates automatically.
- **As a guest**, same as above.
- **As an admin/system**, when either party declines the main invite, the event is cancelled for both (configurable policy), with cancellation ICS sent automatically.

## 4. Key Policies & UX
- **Privacy:** Each attendee receives an ICS with only themselves listed as `ATTENDEE`; the other attendee’s email is never exposed.
- **Organizer:** Central organizer mailbox is the `ORGANIZER` and is visible on invites.
- **Decline policy:**
  - **Guest declines:** unbook the session → remove `guest_id` so others can book; send targeted CANCEL to the guest (their invite), notify host; room remains scheduled/open for booking.
  - **Host declines:** cancel and delete the session → send CANCEL to guest (if booked) and remove the room (and dependent rounds) from the system.
  - (Optional) **Soft decline:** track status per-attendee without operational changes.
- **Rescheduling:**
  - If attendee’s client supports `COUNTER`, treat it as a proposal and route to counterparty for approval.
  - Always include a **“Request new time”** link in DESCRIPTION so any attendee can propose via our simple page (no login).
- **No app login required:** All actions via calendar UI and email links; our pages are tokenized and single-use.

## 5. Functional Requirements

### 5.1 Authentication & Identity
- No end-user login required for propose/approve/decline pages (signed magic tokens).
- Admin/service authentication to mail provider and storage only.

### 5.2 Scheduling & Booking
- Current baseline: ICS is sent on initial booking (not on room creation), and on reschedule only if a guest is booked; delete sends CANCEL if booked.
- Phase 2 target: On booking of a `practice_room`, send **two** ICS REQUEST emails (host and guest), same `UID`, and include `SEQUENCE` management for future updates. No ICS is sent on room creation without a booking.
- Rescheduling accepted triggers **two** ICS REQUEST updates with `SEQUENCE` incremented.
- Deletion or strict decline triggers **two** ICS CANCEL messages.

- In-app actions: Reschedule and cancel initiated from the app trigger the same ICS REQUEST/UPDATE/CANCEL flows using the existing backend endpoints.

Session length selection (new requirement):
- Frontend: When creating a room, the host selects a session length (30/60/90 minutes).
- Backend: Persist `duration_minutes` and compute `DTEND` for ICS from `datetime_utc + duration_minutes`. Optionally persist `end_utc` (denormalized) for analytics and clarity.
- ICS: Use the selected length to set `DTEND` (no longer infer a fixed 60 minutes).

### 5.3 Email/ICS Behavior
- **REQUEST (initial):** send to host and guest separately, same `UID`.
- **REQUEST (update):** same `UID`, `SEQUENCE += 1`, updated `DTSTART/DTEND`.
- **CANCEL:** same `UID`, marks event as cancelled.
- `DESCRIPTION` contains:
  - Plain text instructions
  - Universal **Reschedule** link (tokenized)

Current baseline delta: ICS does not yet include `SEQUENCE`, and DESCRIPTION does not yet include reschedule links. Two separate single-attendee ICS messages are already produced by the backend when notifications are enabled.

### 5.7 Invitation Acceptance Semantics
- Accepting calendar invites is not required for the session to be considered scheduled. Once booked, the session proceeds regardless of explicit acceptance.
- If an attendee does not accept, their client may show the event as "needs-action"/tentative; updates and cancels are still delivered and applied.
- If an attendee explicitly declines (REPLY with `PARTSTAT=DECLINED`), apply the configured policy (default: Strict cancel → send CANCEL to both and close the room).
- Optional enhancement (not required): send a courtesy reminder if neither party accepts within 24 hours.

### 5.4 Inbound iMIP Handling
- Parse inbound `text/calendar`:
  - `METHOD:REPLY` → read `PARTSTAT` (ACCEPTED/DECLINED/TENTATIVE):
    - ACCEPTED: mark attendee accepted.
    - DECLINED:
      - If the guest declines: remove `guest_id` (unbook), send a CANCEL to the guest’s invite only, notify host; keep room open for new bookings.
      - If the host declines: send CANCEL to the guest (if booked), then delete the room (and dependent rounds).
  - `METHOD:COUNTER` (if present): create a **pending proposal**, notify counterparty for approval with magic links.

### 5.5 Tokenized Reschedule Flow
- **Propose link** (from DESCRIPTION/email): opens `/reschedule?r=<token>`.
  - User picks new start/end ± note; submits.
  - System stores `pending_proposal` and emails **Approve/Decline** links to counterparty.
- **Approve link** (one-click): updates event time, sends REQUEST updates (both), marks proposal approved.
- **Decline link** (one-click): marks proposal declined; optionally sends courtesy email to proposer.

### 5.6 Reliability
- Outbound send retries with exponential backoff (mail provider transient errors).
- Idempotency keys on `(uid, sequence, attendee_email, method)` to avoid duplicate sends.
- Inbound dedupe by `Message-ID` and `(uid, method, sequence)`.

## 6. System Design

### 6.1 Services
- **IcsService**: build ICS payloads, escape rules, stable `UID`, increment `SEQUENCE`.
- **NotificationService**: email send (multipart with `text/calendar` and `.ics`), deliverability hooks.
- **IMipIngestor**: parses inbound MIME/ICS; persists events; triggers business rules.
- **ProposalService**: creates/validates tokens (HMAC/JWT), stores `pending_proposals`, sends approval emails, applies updates.

Implemented today:
- An ICS builder constructs minimal ICS with `METHOD`, `UID`, UTC `DTSTART/DTEND`, `SUMMARY`, `ORGANIZER`, single `ATTENDEE`, `STATUS` (no `SEQUENCE` yet).
- A notification sender integrates with Resend and supports feature gating via `NOTIFICATIONS_ENABLED` and redirect via `NOTIFICATIONS_REDIRECT_TO`.

### 6.2 Data Model (additions)
- **practice_rooms**
  - `ics_uid TEXT NOT NULL` (stable) — already present and set on create today
  - `ics_sequence INT NOT NULL DEFAULT 0` — not present today; add in Phase 2
  - `start_utc TIMESTAMP` — used for `DTSTART` (serves as start time; formerly `datetime_utc`)
  - `duration_minutes INT NOT NULL` — new in Phase 2; chosen by host at creation
  - `end_utc TIMESTAMP` — optional denormalization derived from `datetime_utc + duration_minutes`
  - `status ENUM('scheduled','cancelled')` — not present today; add in Phase 2 if needed
- **invitations**
  - `id`, `room_id`, `uid`, `attendee_email`, `attendee_role ENUM('host','guest')`
  - `last_partstat ENUM('needs-action','accepted','declined','tentative')`
  - `last_method_sent ENUM('request','cancel')`
  - `last_message_id TEXT`, `delivery_state JSONB`, `updated_at`
- **pending_proposals**
  - `id`, `room_id`, `uid`
  - `proposed_by ENUM('host','guest')`, `proposer_email`
  - `proposed_start_utc`, `proposed_end_utc`, `note TEXT`
  - `status ENUM('pending','approved','declined','expired')`
  - `created_at`, `expires_at`, `approved_by`, `decision_at`
- **magic_links**
  - `id`, `purpose ENUM('propose','approve','decline')`
  - `uid`, `room_id`, `actor_email`, `actor_role`
  - `token_hash`, `expires_at`, `used_at`
- **imip_messages**
  - `id`, `uid`, `method`, `sequence INT`, `attendee_email`, `partstat`, `raw_pointer`, `received_at`

### 6.3 Identifiers & Mapping
- `practice_rooms.ics_uid` is the canonical meeting identifier.
- `ics_sequence` increments on every update REQUEST. Not yet implemented; Phase 2 will add column and emission.
- Correlate inbound messages by `UID` (mandatory) and `SEQUENCE` where present.

## 7. API
The following reflects today’s API and Phase 2 additions:

- Existing endpoints
  - `POST /api/practice-room/create` — Creates Daily room + DB rows; seeds first round.
  - `POST /api/practice-room/update` — Booking (`{ roomId, guestId }`) and reschedule (`{ roomId, startUtc }`) with guards.
  - `DELETE /api/practice-room/:roomId` — Deletes dependent rounds then the room; host-only.
- Internal ICS sending is handled inside the backend service (no public `/api/ics/*` endpoints). Phase 2 may keep this internal.
- Phase 2 new endpoints (tokenized/iMIP):
  - `GET  /reschedule?r=<token>` — Renders minimal form (start/end/note).
  - `POST /api/reschedule/propose` — `{ token, proposedStartUtc, proposedEndUtc, note }` → creates `pending_proposal`, emails counterparty links.
  - `GET  /approve?t=<token>` — Applies update; sends two REQUEST updates; marks proposal approved.
  - `GET  /decline?t=<token>` — Marks proposal declined; courtesy email to proposer.
  - `POST /api/imip/inbound` (webhook) or IMAP poller — Receives raw MIME; extracts ICS; handles REPLY/COUNTER.
  - `POST /api/hooks/email-status` — Delivery/bounce tracking (optional).

## 8. Email & ICS Specifications

### 8.1 ICS Minimal Fields
- `METHOD: REQUEST|CANCEL`
- `UID: <stable>`
- `DTSTAMP: <utc>`
- `DTSTART/DTEND: <utc>` (or with `VTIMEZONE` if preferred)
- `SUMMARY`, `ORGANIZER:mailto:...`
- `ATTENDEE:mailto:...` (exactly **one** per ICS we send)
- `SEQUENCE: <int>` (increment on updates)
- `STATUS: CONFIRMED|CANCELLED`
- `DESCRIPTION:` includes human text **and** the Reschedule URL.

Current baseline emission:
- All the above except `SEQUENCE` and `DESCRIPTION` reschedule link. End time is inferred as +1 hour from `datetime_utc`.

### 8.2 MIME Parts (best compatibility)
- `text/plain` (or `text/html`) — human message
- `text/calendar; method=REQUEST; charset=UTF-8`
- Attachment: `invite.ics` with `Content-Type: text/calendar; method=REQUEST; name="invite.ics"`

### 8.3 Templates
- **Invite (REQUEST)**: subject “Practice Session — Invitation”
- **Update (REQUEST)**: subject “Practice Session — Updated Time”
- **Cancel (CANCEL)**: subject “Practice Session — Cancelled”
- **Proposal Approval**: subject “Approve new time for Practice Session?”

## 9. Flows (Sequence)

### 9.1 Booking → Initial Invites
1. Current baseline: ICS REQUEST is sent when a guest books an open session; not at room creation. Two separate single-attendee ICS messages are sent (feature-gated).
2. Phase 2 target: generate `uid` (already present), set `sequence=0`, send initial REQUEST to both upon booking/create per policy.
3. Attendees Accept/Decline via calendar; REPLY ingestion will be added in Phase 2.

### 9.2 Decline (Strict Cancel policy)
1. Receive REPLY with `PARTSTAT=DECLINED`.
2. If the guest declines: unbook the session (remove `guest_id`), send CANCEL to the guest’s invite, notify host; keep room open.
3. If the host declines: send CANCEL to guest (if booked) and delete the room (and dependent rounds).
4. Current baseline: CANCEL is sent on delete only (and only if a guest had booked); inbound REPLY handling is not yet implemented.

*(If Soft policy is chosen: record decline; do not cancel.)*

### 9.3 Reschedule via COUNTER (when supported)
1. Receive `METHOD:COUNTER` with new `DTSTART/DTEND`.
2. Create `pending_proposal` and email counterparty **Approve/Decline** links.
3. **Approve** → bump `SEQUENCE`, send two REQUEST updates with new times.
4. **Decline** → notify proposer; no event change.

### 9.4 Reschedule via Link (universal)
1. Attendee clicks `Reschedule` link in DESCRIPTION.
2. Proposes new time (no login).
3. Counterparty receives Approve/Decline links.
4. **Approve** → bump `SEQUENCE`, send two REQUEST updates.
5. **Decline** → notify proposer.

## 10. Security & Privacy
- **Tokenization:** HMAC/JWT short-lived (e.g., 48h), single-use; bound to `{uid, role, email}`.
- **Replay protection:** `magic_links.used_at` check; idempotent handlers.
- **PHI/PII:** store only necessary metadata; never include the other party’s email in any ICS.
- **Mailbox auth:** enforce SPF/DKIM/DMARC; verify inbound authenticity as feasible (provider headers).
- **Audit:** log all outbound and inbound ICS, decisions, and token usage.

## 11. Reliability & Observability
- **Retries:** mail send retries; IMAP/webhook retry on transient errors.
- **Idempotency:** dedupe keys as described.
- **Metrics:** counts for sends, replies parsed, proposals created, approvals, declines, bounces.
- **Alerts:** bounce rate spikes; parser failures; unsigned/invalid tokens.

## 12. Time Zones
- Store UTC in DB. In ICS, either:
  - Emit UTC `DTSTART/DTEND` (simplest), **or**
  - Include `VTIMEZONE` for localized rendering (adds complexity).
- Render local times in any human-readable email bodies.

## 13. Edge Cases
- **Double proposals:** latest approval wins; auto-expire earlier pending proposals.
- **Simultaneous approves:** idempotent update by `(uid, sequence+1)`; reject second approval if sequence already advanced.
- **Forwarded invites:** if a third party replies, ignore unless email matches expected attendee.
- **Expired tokens:** show friendly “link expired” page with a new **Request new time** button to restart.
- **Attendee modifies event locally:** local copies may drift; our CANCEL/REQUEST updates are the source of truth.
- **Non-calendar replies (“can we do 3pm?”):** detect and auto-reply with a proposal link.

## 14. Migration Plan
1. `ics_uid` already exists and is set on create today. Add `ics_sequence` column; backfill as needed.
2. Extend existing ICS builder/notification to include `SEQUENCE`, DESCRIPTION templates with reschedule link, and update-flow semantics.
3. Stand up inbound mail processing (webhook or IMAP poller) and parser.
4. Add tokenized proposal + approval flows and pages.
5. Flip policy flags (strict cancel vs soft) once validated.
6. Remove Google-specific codepaths if replacing Phase 2, or keep both behind `CalendarService` abstraction.

## 15. Acceptance Criteria
- Creating a booked room sends **two** REQUEST invites (same `UID`), one to each attendee; no PII leakage between attendees.
- Either attendee can accept/decline from their calendar; a decline triggers CANCEL to both (strict policy).
- Either attendee can request a new time **without logging in** via link; the counterparty can approve/decline via one-click magic links.
- On approval, both attendees receive an updated REQUEST (same `UID`, `SEQUENCE+1`) and their calendars update.
- If the attendee’s client supports `COUNTER`, we ingest it and route approval accordingly.
- All actions are auditable; tokens are single-use; retries are idempotent.

## 16. Open Questions / Decisions
- Final default policy on decline: **Strict cancel** (recommended) vs **Soft**?
- UTC-only vs `VTIMEZONE` in ICS?
- Proposal expiry window (24h vs 48h)?
- Do we show the updated time in the approval email in both UTC and requester’s guessed local TZ?
