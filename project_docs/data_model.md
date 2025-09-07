
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
  - Linked as `host_id` and `guest_id` in `practice_rooms`

- **RLS Policies**:
  - ✅ `SELECT`: Allow all users to select profiles (e.g. for displaying upcoming sessions)
  - ✅ `INSERT`: Enable insert for users where `user_id = auth.uid()`

---

### 🗂️ Table: `practice_rooms`

- Stores metadata on the rooms (rooms are synonymous to practice sessions)
- **Columns**:
  - `id`: Unique identifier - UUID, primary key
  - `host_id`: Host of the session, the user who scheduled it - UUID, references `profiles(user_id)`
  - `guest_id`: Guest of the session, the user who accepted the session - UUID, nullable, references `profiles(user_id)`
  - `datetime_utc`: Date and time of session
  - `first_round_id`: FK to session_rounds table containing details of round 1 - UUID, references `session_rounds(id)`
  - `second_round_id`: FK to session_rounds table containing details of round 2 -  UUID, references `session_rounds(id)`
  - `type`: type of session (e.g. Clinical / Communication) - text
  - `room_url`: session room identifier or link - unique text
  - `stage`: Indicates which stage the session is at (1 / 2 / 3)
  - `private`: Indicates if room is private / not available on scheduling board - Boolean
  - `created_at`: timestamp with time zone, defaults to `now() at time zone 'utc'`

- **Constraints**:
  - `room_url` must be unique
  - Foreign keys link to `profiles` and `session_rounds`

- **RLS Policies**:
  - ✅ `SELECT`: Non-users can see sessions created by other users (e.g. for session discovery)
  - ✅ `INSERT`: Users can create their own sessions (`host_id = auth.uid()`)
  - ✅ `DELETE`: Users can delete their own sessions (`host_id = auth.uid()`)
  - ✅ `UPDATE`: 
    - Users can update their own sessions (`host_id = auth.uid()`)
    - Users can sign up to others' sessions as guest (`guest_id = auth.uid()`)
  - Enabled for realtime subscriptions

---

### 🗂️ Table: `practice_rounds`

- Stores information about the rounds of practice carried out in a room. Expect no more than 2 rounds in a room
- **Columns**:
  - `id`: UUID, primary key
  - `room_id`: Room in which practice round were carried out
  - `candidate_id`: Candidate for that round - UUID, references `profiles(user_id)`
  - `case_briefs_id`: Case brief for that round - UUID, nullable, references `case_briefs(id)`
  - `transcript`: JSON containing the transcript for the session
  - `assessment`: JSON containing the LLM assessment of the transcript

- **Constraints**:
  - Foreign keys link to `profiles` and `case_briefs`

---

### 🧾 Table: `case_briefs`

- Stores case materials used during sessions  
- **Columns**:
  - `id`: UUID, primary key (auto-generated)
  - `category`: text — thematic grouping of the case
  - `condition`: text — clinical or medical condition
  - `case_name`: text — descriptive name of the case for display in UI
  - `case_name_internal`: text - name of case for internal team reference
  - `domain`: Clinical or Communication
  - `candidate_brief`: text — visible to the candidate
  - `actor_brief`: text — visible to the actor/assessor

- **Usage**:
  - Linked from `practice_rooms` via `case_id`

