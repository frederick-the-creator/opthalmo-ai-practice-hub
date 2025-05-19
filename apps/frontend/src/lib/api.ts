import axios from "axios";

// Base API URL - update this to point to your actual backend API
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function updateSessionMeta({ sessionId, candidateId, caseId }: { sessionId: string, candidateId: string, caseId: string }) {
  const response = await api.post("/update-session-meta", {
    session_id: sessionId,
    candidate_id: candidateId,
    case_id: caseId,
  });
  return response.data;
}

export async function createSession({ host_id, date, time, type }: { host_id: string, date: string, time: string, type: string }) {
  const response = await api.post("/create-session", {
    host_id,
    date,
    time,
    type,
  });
  return response.data;
} 