
## 🧑‍⚕️ Med Practice Platform — Data Model

This document outlines the key database tables and Row-Level Security (RLS) policies for the practice session platform.

---

### 👤 Table: `profiles`

- Stores user profile information  
- **Columns**:
  - `user_id`: UUID, primary key, defaults to `auth.uid()`
  - `first_name`: text, required
  - `last_name`: text, required
  - `training_level`: text, required
  - `avatar`: text, optional (URL or reference to image)

- **Relationships**:
  - Linked as `host_id` and `guest_id` in `practice_sessions`

- **RLS Policies**:
  - ✅ `SELECT`: Allow all users to select profiles (e.g. for displaying upcoming sessions)
  - ✅ `INSERT`: Enable insert for users where `user_id = auth.uid()`

---

### 🗂️ Table: `practice_sessions`

- Stores information about scheduled practice sessions  
- **Columns**:
  - `id`: UUID, primary key
  - `host_id`: UUID, references `profiles(user_id)`
  - `guest_id`: UUID, nullable, references `profiles(user_id)`
  - `datetime_utc`: Date and time of session
  - `type`: text — type of session (e.g. mock, review)
  - `room_url`: unique text — session room identifier or link
  - `case_id`: UUID, nullable, references `cases(id)`
  - `candidate_id`: UUID, nullable
  - `version`: integer, defaults to 1
  - `created_at`: timestamp with time zone, defaults to `now() at time zone 'utc'`

- **Indexes**:
  - `host_id` — to query all sessions hosted by a user
  - `guest_id` — to query all sessions where a user is a guest

- **Constraints**:
  - `room_url` must be unique
  - Foreign keys link to `profiles` and `cases`

- **RLS Policies**:
  - ✅ `SELECT`: Non-users can see sessions created by other users (e.g. for session discovery)
  - ✅ `INSERT`: Users can create their own sessions (`host_id = auth.uid()`)
  - ✅ `DELETE`: Users can delete their own sessions (`host_id = auth.uid()`)
  - ✅ `UPDATE`: 
    - Users can update their own sessions (`host_id = auth.uid()`)
    - Users can sign up to others' sessions as guest (`guest_id = auth.uid()`)
  - Enabled for realtime subscriptions

---

### 🧾 Table: `cases`

- Stores case materials used during sessions  
- **Columns**:
  - `id`: UUID, primary key (auto-generated)
  - `candidate_brief`: text — visible to the candidate
  - `actor_brief`: text — visible to the actor/assessor
  - `markscheme`: text — used for evaluation or feedback
  - `category`: text — thematic grouping of the case
  - `condition`: text — clinical or medical condition
  - `case_name`: text — descriptive name of the case
  - `domain`: text — skill or competency domain (e.g. communication, ethics)

- **Usage**:
  - Linked from `practice_sessions` via `case_id`


  ### 📁 Supabase Storage Bucket: `practice_transcriptions`

- **Purpose:**  
  Stores JSON transcription files for each practice session.

- **Bucket Name:**  
  `transcriptions`

- **File Structure:**  
  Each transcription is stored as `transcriptions/{session_id}/transcript.json`, where `{session_id}` matches the `id` in the `practice_sessions` table.

- **Access Control (RLS Policies):**
  - **Read:** Allowed for users who are the `host` or `guest` of the session.
  - **Insert/Upload:** Allowed for the `host` of the session.
  - **Delete:** Allowed for the `host` of the session.
  - **Public:** **Not public** (private bucket).

- **Security Implementation:**
  - RLS (Row Level Security) is enabled on the `storage.objects` table.
  - Policies use the session ID in the file path to match against the `practice_sessions` table and the authenticated user’s UID.

- **Relevant Table Links:**
  - `practice_sessions.id` (UUID) is used as the folder name for each session’s transcription.

**Example file path:**  
`practice_transcriptions/123e4567-e89b-12d3-a456-426614174000/transcript.json`