require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { supabase, updateSession } = require('./supabase');

const app = express();
const PORT = process.env.PORT || 4000;

const FRONTEND_URL = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', FRONTEND_URL);

app.use(cors({
  origin: FRONTEND_URL,
  methods: ['GET', 'POST', 'OPTIONS'],
  credentials: true // optional: only needed if you're sending cookies or auth headers
}));
app.use(express.json());

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Create session endpoint: creates Daily room, then inserts session in Supabase
app.post('/api/create-session', async (req, res) => {
  console.log('--- /api/create-session called ---');
  console.log('Request body:', req.body);
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!SUPABASE_SERVICE_ROLE_KEY);
  const { host_id, date, time, type } = req.body;
  if (!host_id || !date || !time || !type) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    // 1. Create Daily.co room
    const dailyRes = await axios.post(
      'https://api.daily.co/v1/rooms',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const roomUrl = dailyRes.data.url;
    console.log('Daily.co room created:', roomUrl);

    // 2. Insert into Supabase
    const { data, error } = await supabase
      .from('practice_sessions')
      .insert([
        { host_id, date, time, type, room_url: roomUrl }
      ])
      .select();
    if (error) {
      console.error('Supabase insert error:', error);
      return res.status(500).json({ error: 'Failed to create session' });
    }
    console.log('Supabase insert result:', data);
    res.json({ session: data[0] });
  } catch (error) {
    console.error('Error creating session:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

app.post('/api/sessions/accept-invite', async (req, res) => {
  const { sessionId, guestId } = req.body;
  if (!sessionId || !guestId) {
    return res.status(400).json({ error: 'Missing sessionId or guestId' });
  }
  try {
    const { data, error } = await updateSession(sessionId, { guest_id: guestId });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ session: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to accept invitation' });
  }
});

app.post('/api/sessions/set-candidate', async (req, res) => {
  const { sessionId, candidateId } = req.body;
  if (!sessionId || !candidateId) {
    return res.status(400).json({ error: 'Missing sessionId or candidateId' });
  }
  try {
    const { data, error } = await updateSession(sessionId, { candidate_id: candidateId });
    if (error) {
      return res.status(500).json({ error: error.message });
    }
    res.json({ session: data[0] });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to set candidate' });
  }
});

app.post('/api/sessions/set-case', async (req, res) => {
  const { sessionId, caseId } = req.body;
  if (!sessionId || !caseId) {
    return res.status(400).json({ error: 'Missing sessionId or caseId' });
  }
  try {
    const session = await updateSession(sessionId, { case_id: caseId });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to set case' });
  }
});

app.post('/api/sessions/set-stage', async (req, res) => {
  const { sessionId, version } = req.body;
  if (!sessionId || typeof version !== 'number') {
    return res.status(400).json({ error: 'Missing sessionId or version' });
  }
  try {
    const session = await updateSession(sessionId, { version });
    res.json({ session });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Failed to set stage' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 