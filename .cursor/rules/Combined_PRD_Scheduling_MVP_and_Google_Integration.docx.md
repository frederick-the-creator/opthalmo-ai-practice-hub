# **Combined PRD — Scheduling (Phase 1 Email/ICS, Phase 2 Google, Phase 3 Slots)**

## **0. Executive Summary**

We will ship scheduling in three phases. Phase 1 adds Email/ICS notifications using the existing `practice_rooms`/`practice_rounds` model; no ICS on room creation; ICS is sent to both host and guest on booking, reschedule, and delete. Phase 2 mandates Google Calendar integration (not optional): the app uses Google sign up only and requires users to grant Google Calendar access. Phase 3 introduces availability slots and a booking flow to avoid creating Daily rooms for every potential time.

## **1. Objectives**

- Hosts create sessions at a future time; other users can book those sessions.
- Notify participants via Email/ICS at the right lifecycle events with minimal refactors.
- Keep a clean migration path to Google Calendar and later availability slots.
- Maintain current stage values that drive `InterviewPracticeRoom.tsx` without standardization changes.
 - Starting Phase 2, users must sign up with Google and grant Calendar access; access is blocked until connected.

## **2. Scope**

In scope (Phase 1 — Email/ICS, no Google, no slots):
- Create/update/delete `practice_rooms` with `datetime_utc` and `private` flag.
- Booking: any user (not the host) can book an open session; booking sets `guest_id`.
- Email/ICS only when a user books; updates/cancels behave accordingly (see matrix).
- New DELETE route that sends cancellation email/ICS before deleting the room and rounds.
- UI: host can reschedule a booked session by changing `datetime_utc`.

In scope (Phase 2 — Google Calendar):
- Mandate Google Calendar integration behind a `CalendarService` abstraction.
- Replace app sign up with Google-only; require Calendar scopes at sign up.
- Use existing scheduling model; only confirmed (booked) rooms create Google events.

In scope (Phase 3 — Availability Slots):
- Add `slots` and a separate booking flow to avoid creating Daily rooms per slot.
- On booking, create `practice_room` and Daily room, then proceed as in Phase 1/2 for notifications.

## **3. Phase 1 — Email/ICS (No Google, No Slots)**

### **3.1 Goals & Success Criteria**

- Host can create a scheduled room; backend provisions a Daily room URL and creates an initial round (`round_number = 1`).
- Another user can book the open session; UI updates via Supabase realtime.
- Only when a session is booked, send Email/ICS (REQUEST) to both host and guest.
- Host can reschedule in the UI; rescheduling sends ICS REQUEST update to both host and guest.
- Deleting a session sends ICS CANCEL to both host and guest, then deletes DB rows.

### **3.2 Functional Requirements**

Authentication & Identity
- Existing Supabase auth; backend validates via `Authorization: Bearer <token>`.

Scheduling & Booking
- Create room with `{ hostId, datetimeUtc, private }`; server creates Daily room and inserts `practice_rooms`, creates initial `practice_rounds`.
- Booking sets `guest_id` if it is null (guard against overwriting if already set). Any authenticated user (not the host) can book an open session.

Email/ICS Triggers
- No ICS on room creation.
- On booking (guest set from null): send ICS (METHOD:REQUEST) to both host and guest (stable `UID`).
- On reschedule (`datetime_utc` change): send ICS (METHOD:REQUEST) update to both host and guest (same `UID`).
- On delete: send ICS (METHOD:CANCEL) to both host and guest; then delete `practice_rounds` followed by the `practice_room`.

UI Notes
- Room List/Detail: show open sessions; non-hosts can book if the session has no `guest_id`.
- Host Reschedule: provide a simple date/time edit action that updates `datetime_utc`.

### **3.3 API**

- POST `/api/practice-room/create` → creates Daily room, inserts `practice_rooms`, creates initial `practice_rounds`.
- POST `/api/practice-room/update` → updates room fields (e.g., `guestId`, `datetimeUtc`, `private`, `stage`).
  - If `guestId` transitions from null to a value (booking) → trigger host and guest ICS REQUEST.
  - If `datetimeUtc` changes → trigger host and guest ICS REQUEST update.
  - Guard booking: if `guest_id` is already set, return 409; do not overwrite.
- DELETE `/api/practice-room/:roomId` (new) → load room + profiles, send ICS CANCEL to both host and guest, then delete `practice_rounds` followed by `practice_rooms`.
- (Optional) POST `/api/hooks/email-status` → provider webhook for bounces/deliverability audits.

### **3.4 Data Model**

Use existing tables:
- `practice_rooms` (id, host_id, guest_id, stage, room_url, private, created_at, datetime_utc)
- `practice_rounds` (id, room_id, round_number, candidate_id, case_brief_id, transcript, assessment, created_at)

Additions:
- `practice_rooms.ics_uid` (text, required once room is created; UUID v4 recommended). Stable UID for ICS REQUEST/UPDATE/CANCEL.

Notes:
- Resolve emails server-side from `auth.users` using a Supabase Admin (service-role) client to avoid RLS exposure and duplication.

### **3.5 Services & Implementation Notes**

- `NotificationService` (Phase 1 impl): integrates with Postmark/Resend/SendGrid.
- `IcsService`: generates ICS payloads: `{ uid, method, startUtc, endUtc, summary, organizer, attendees, status }`.
- Use a Supabase Admin client (`SUPABASE_SERVICE_ROLE_KEY`) to fetch host/guest emails by `user_id`.
- Wire notifications into:
  - Room update: detect booking (`guest_id` set) or `datetime_utc` change.
  - Room delete: send cancellations before deleting DB rows.

### **3.6 Notifications Matrix (Phase 1)**

- Booked → Email ICS (METHOD:REQUEST) to host and guest (same `UID`).
- Rescheduled → Email ICS (METHOD:REQUEST) update to host and guest (same `UID`).
- Deleted (cancel) → Email ICS (METHOD:CANCEL) to host and guest.
- Reminders → Optional (defer).

## **4. Phase 2 — Google Calendar Integration**

### **4.1 Policy & UX**

- Google-only authentication; users must grant Calendar access during signup. Until granted, access to core features is blocked and onboarding prompts the connection.
- Operate behind `CalendarService` abstraction.
- Only booked rooms create Google events; availability remains app-only until Phase 3 slots.

### **4.2 Functional Requirements**

Authentication & Scopes
- Google OAuth2 with offline access (refresh token).
- Scopes: `calendar`, `calendar.readonly`, `calendar.freebusy`.
 - Scopes are required at signup; if access is revoked, the user is re-prompted and core features are gated until restored.

Calendars & Safety
- Create a dedicated secondary calendar per user (e.g., “AppName Meetings”).
- Operate only on the dedicated calendar; never modify primary.
- Use `extendedProperties.private` for DB linkage.

Booking & Lifecycle
- On booked room, create a calendar event; add other user as attendee; `sendUpdates=all`.
- Reschedule/cancel propagate to Google; app mirrors state.

Sync & Webhooks
- Use `events.watch` (push notifications) and incremental sync (`syncToken`).

### **4.3 API (Delta)**

- POST `/api/auth/google/callback` — exchange code; store refresh token; create secondary calendar.
- POST `/api/google/webhook` — receive notifications; fetch deltas; upsert into DB.

### **4.4 Data Model Additions**

- users: `google_account_id`, `google_refresh_token` (encrypted), `calendar_id`.
- practice_rooms: `google_event_id` (mapping aligned with `ics_uid`).
- webhook_channels: `(id, user_id, channel_id, resource_id, expiration_ts)`.

### **4.5 Notifications (Phase 2)**

- Booked → Google invite/notification.
- Rescheduled → Google update notification.
- Deleted → Google cancellation notification.

## **5. Phase 3 — Availability Slots**

### **5.1 Overview**

- Introduce `slots` and booking to avoid creating Daily rooms per potential time.
- Availability remains app-only; only booked sessions create a `practice_room` (and Daily room).

### **5.2 API (Slots)**

- POST `/api/slots` — create availability (DB only).
- GET `/api/slots?status=open` — list open slots (exclude my own).
- POST `/api/slots/:id/book` — transactional booking; creates `practice_room` and first `practice_round`.

### **5.3 Data Model (Slots)**

- slots: `(id, host_id, start_ts, end_ts, status ENUM(open, booked, cancelled), created_at, updated_at)`.

## **6. Shared Requirements**

- Time zones: store UTC; render per-user TZ; ensure ICS/Event payloads reflect TZ.
- Access control: backend writes use `req.supabaseAsUser` to honor RLS; emails resolved with Admin client.
- Audit trails: record create/update/delete and notification attempts.
- Reliability: retries/backoff for provider API calls; webhook renewal where applicable.

## **7. Migration Plan**

1) Introduce `NotificationService` and `IcsService` now; wire to Phase 1 triggers.
2) Add `CalendarService` for Phase 2; keep `ics_uid` stable and map to `google_event_id` if both coexist.
3) Add the DELETE route and guard booking (no overwrite of `guest_id`).
4) Add `practice_rooms.ics_uid`; backfill for existing rows on first send if needed.
5) Phase 3: add slots and booking; keep all integrations behind the existing service seams.

## **8. Acceptance Criteria**

Phase 1
- Creating a room does not send ICS.
- When a non-host user books an open session, both host and guest receive an Email/ICS (REQUEST) with a stable UID.
- Rescheduling by the host sends an updated ICS (REQUEST) to both host and guest (same UID).
- Deleting a room sends an ICS (CANCEL) to both host and guest, then deletes the room and its rounds.

Phase 2
- Users must sign up with Google and grant Calendar access; booked rooms create events on the dedicated calendar; lifecycle changes sync within ~1 minute via webhook.

Phase 3
- Hosts can post availability slots; booking a slot creates a `practice_room` and triggers the same notification/Calendar flow as above.

## **Appendix A — ICS Minimal Fields**

METHOD: REQUEST / CANCEL; UID (stable); DTSTART/DTEND; SUMMARY; ORGANIZER; ATTENDEE; STATUS.

## **Appendix B — Google Event JSON (Example)**

Key fields: `summary`, `start/end` (with `timeZone`), `attendees`, `conferenceData` (optional), `reminders`, `transparency`, `extendedProperties.private`, `sendUpdates=all`. 