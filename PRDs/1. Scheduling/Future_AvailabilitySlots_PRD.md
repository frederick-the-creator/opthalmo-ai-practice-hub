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