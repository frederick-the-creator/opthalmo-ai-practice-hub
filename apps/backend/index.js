require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 4000;

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
console.log('FRONTEND_URL:', FRONTEND_URL);
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

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

// Create Daily.co room endpoint
app.post('/api/create-room', async (req, res) => {
  try {
    const response = await axios.post(
      'https://api.daily.co/v1/rooms',
      {},
      {
        headers: {
          'Authorization': `Bearer ${process.env.DAILY_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );
    const roomUrl = response.data.url;
    res.json({ url: roomUrl });
  } catch (error) {
    console.error('Error creating Daily.co room:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create room' });
  }
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

// Update session meta endpoint: updates case_id and candidate_id for a session
app.post('/api/update-session-meta', async (req, res) => {
  console.log('--- /api/update-session-meta called ---');
  console.log('Request body:', req.body);
  console.log('SUPABASE_URL:', SUPABASE_URL);
  console.log('SUPABASE_SERVICE_ROLE_KEY exists:', !!SUPABASE_SERVICE_ROLE_KEY);
  const { session_id, case_id, candidate_id } = req.body;
  if (!session_id || !case_id || !candidate_id) {
    console.log('Missing required fields');
    return res.status(400).json({ error: 'Missing required fields' });
  }
  try {
    const { data, error } = await supabase
      .from('practice_sessions')
      .update({ case_id, candidate_id })
      .eq('id', session_id)
      .select();
    if (error) {
      console.error('Supabase update error:', error);
      return res.status(500).json({ error: 'Failed to update session' });
    }
    console.log('Supabase update result:', data);
    res.json({ session: data[0] });
  } catch (error) {
    console.error('Error updating session:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

app.listen(PORT, () => {
  console.log(`Backend server running on port ${PORT}`);
}); 