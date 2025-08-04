import axios from "axios";

// Base API URL - update this to point to your actual backend API
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE_URL = `${RAW_API_BASE_URL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


export async function createSession({ host_id, date, time, type, datetime_utc }: { host_id: string, date: string, time: string, type: string, datetime_utc: string }) {
  const response = await api.post("/create-session", {
    host_id,
    date,
    time,
    type,
    datetime_utc,
  });
  return response.data;
}

export async function acceptInvitation({ sessionId, guestId }: { sessionId: string, guestId: string }) {
  const response = await api.post("/sessions/accept-invite", { sessionId, guestId });
  return response.data;
}

export async function setCandidate({ sessionId, candidateId }: { sessionId: string, candidateId: string }) {
  const response = await api.post("/sessions/set-candidate", { sessionId, candidateId });
  return response.data;
}

export async function setCase({ sessionId, caseId }: { sessionId: string, caseId: string }) {
  const response = await api.post("/sessions/set-case", { sessionId, caseId });
  return response.data;
}

export async function setStage({ sessionId, version }: { sessionId: string, version: number }) {
  const response = await api.post("/sessions/set-stage", { sessionId, version });
  return response.data;
}

export async function startRecording({ room_url }: { room_url: string }) {
  console.log('Starting recording function', room_url);
  const response = await api.post("/sessions/start-recording", { room_url });
  return response.data;
}

export async function stopRecording({ room_url, sessionId }: { room_url: string, sessionId: string }) {
  console.log('Stopping recording function room_url', room_url);
  console.log('Stopping recording function sessionId', sessionId);
  const response = await api.post("/sessions/stop-recording", { room_url, sessionId });
  return response.data;
}