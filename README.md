## Project Overview

- Educational app for medical students helping them to practice mock interviews with peers
- Users schedule meetings (practice rooms) with each other, post meeting times and accept other users meetings `apps/frontend/src/pages/InterviewScheduling.tsx`
- Users join the meeting and then talk to each other on video call using Daily.co integration. They role play a diagnostic scenario, with one user playing a patient and the other as the doctor to diagnose the patient. Users can do multiple rounds in the practice room, switching roles and doing different cases. `apps/frontend/src/pages/InterviewPracticeRoom.tsx`
- Users can record their meeting rounds and these are processed to provide AI generated assessments of their performance. An overview of their assessments is in `apps/frontend/src/pages/AssessmentHistory.tsx`