# PRD — Hybrid Scheduling (ICS + Tokenized Approvals, Central Organizer)

## 0. Executive Summary
We will deliver a privacy-preserving scheduling flow using standard iCalendar (ICS/iTIP over email) plus a universal “Request new time” link. The central organizer (a single mailbox controlled by us) sends **two separate single-attendee invites** with the same UID to host and guest so they don’t see each other’s email. Attendees can accept/decline from their own calendar apps. For rescheduling, we support (a) native iTIP COUNTER where available and (b) a tokenized email/web link that lets either party request a new time and the other party approve or decline **without logging in**. On approval, both attendees receive an updated ICS; on decline, no change (or cancel, per policy).

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

## 3. User Stories
- **As a host**, I receive an invite via email, add it to my calendar, and can accept/decline. If I need a different time, I click “Request new time” in the invite and propose a new time; the guest gets an approval email; on approval, my calendar updates automatically.
- **As a guest**, same as above.
- **As an admin/system**, when either party declines the main invite, the event is cancelled for both (configurable policy), with cancellation ICS sent automatically.

## 4. Key Policies & UX
- **Privacy:** Each attendee receives an ICS with only themselves listed as `ATTENDEE`; the other attendee’s email is never exposed.
- **Organizer:** Central organizer mailbox is the `ORGANIZER` and is visible on invites.
- **Decline policy:** Configurable:
  - **Strict cancel** (default): if either attendee declines the *active* event, send CANCEL to both and close the room.
  - **Soft decline:** keep the event if one party declines; status tracks per-attendee (optional).
- **Rescheduling:**
  - If attendee’s client supports `COUNTER`, treat it as a proposal and route to counterparty for approval.
  - Always include a **“Request new time”** link in DESCRIPTION so any attendee can propose via our simple page (no login).
- **No app login required:** All actions via calendar UI and email links; our pages are tokenized and single-use.

## 5. Functional Requirements

### 5.1 Authentication & Identity
- No end-user login required for propose/approve/decline pages (signed magic tokens).
- Admin/service authentication to mail provider and storage only.

### 5.2 Scheduling & Booking
- Creating a `practice_room` with a booked guest triggers **two** ICS REQUEST emails (host and guest), same `UID`, `SEQUENCE=0`.
- Rescheduling accepted triggers **two** ICS REQUEST updates with `SEQUENCE` incremented.
- Deletion or strict decline triggers **two** ICS CANCEL messages.

### 5.3 Email/ICS Behavior
- **REQUEST (initial):** send to host and guest separately, same `UID`.
- **REQUEST (update):** same `UID`, `SEQUENCE += 1`, updated `DTSTART/DTEND`.
- **CANCEL:** same `UID`, marks event as cancelled.
- `DESCRIPTION` contains:
  - Plain text instructions
  - Universal **Reschedule** link (tokenized)

### 5.4 Inbound iMIP Handling
- Parse inbound `text/calendar`:
  - `METHOD:REPLY` → read `PARTSTAT` (ACCEPTED/DECLINED/TENTATIVE):
    - ACCEPTED: mark attendee accepted.
    - DECLINED: apply **strict cancel** policy by default → send CANCEL to both; update DB.
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

### 6.2 Data Model (additions)
- **practice_rooms**
  - `ics_uid TEXT NOT NULL` (stable)
  - `ics_sequence INT NOT NULL DEFAULT 0`
  - `start_utc TIMESTAMP`, `end_utc TIMESTAMP`
  - `status ENUM('scheduled','cancelled')`
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
- `ics_sequence` increments on every update REQUEST.
- Correlate inbound messages by `UID` (mandatory) and `SEQUENCE` where present.

## 7. API
*(Internal/server-to-server; endpoints and names are illustrative — adapt to your stack.)*

- `POST /api/practice-room/create`  
  Creates Daily room + DB rows (unchanged from Phase 1).
- `POST /api/practice-room/book`  
  Sets `guest_id`; triggers `SendInitialInvites(uid)`.
- `POST /api/practice-room/delete`  
  Triggers `SendCancel(uid)` to both; then deletes rows (or marks cancelled).
- `POST /api/ics/send-invite` (internal)  
  Body: `{ uid, attendeeEmail, startUtc, endUtc, sequence }`
- `POST /api/ics/send-update` (internal)  
  Body: `{ uid, attendeeEmail, startUtc, endUtc, sequence }`
- `POST /api/ics/send-cancel` (internal)  
  Body: `{ uid, attendeeEmail }`
- `GET  /reschedule?r=<token>`  
  Renders minimal form (start/end/note).
- `POST /api/reschedule/propose`  
  Body: `{ token, proposedStartUtc, proposedEndUtc, note }` → creates `pending_proposal`, emails counterparty links.
- `GET  /approve?t=<token>` → applies update; sends two REQUEST updates; marks proposal approved.
- `GET  /decline?t=<token>` → marks proposal declined; courtesy email to proposer.
- `POST /api/imip/inbound` (webhook) **or** IMAP poller  
  Receives raw MIME; extracts ICS; handles REPLY/COUNTER.
- `POST /api/hooks/email-status`  
  Delivery/bounce tracking (optional).

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
1. Room booked → generate `uid`, set `sequence=0`.
2. Send REQUEST (host) + REQUEST (guest), each with only their own `ATTENDEE`.
3. Attendees Accept/Decline via calendar; we ingest REPLY.

### 9.2 Decline (Strict Cancel policy)
1. Receive REPLY with `PARTSTAT=DECLINED` from either party.
2. Send CANCEL to **both** attendees.
3. Mark room cancelled.

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
1. Add `ics_uid` + `ics_sequence` columns; backfill as needed.
2. Implement `IcsService` + `NotificationService`; wire initial booking → REQUEST.
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
