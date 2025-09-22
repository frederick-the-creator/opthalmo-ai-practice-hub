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


export async function createPracticeRoom({ hostId, type, datetimeUtc, private: isPrivate }: { hostId: string, type: string, datetimeUtc: string, private: boolean }) {

  const createFields = { hostId, type, datetimeUtc, private: isPrivate }

  const response = await api.post("/practice-room/create", { createFields });
  return response.data;
}

export async function acceptInvitation({ roomId, guestId }: { roomId: string, guestId: string }) {
  const updateFields = {roomId, guestId}
  const response = await api.post("/practice-room/update", { updateFields });
  return response.data;
}

export async function setStage({ roomId, stage }: { roomId: string, stage: string }) {
  const updateFields = { roomId, stage }
  const response = await api.post("/practice-room/update", { updateFields });
  return response.data;
}



export async function setRoundCandidate({ roundId, candidateId }: { roundId: string, candidateId: string }) {
  const response = await api.post("/practice-round/set-candidate", { roundId, candidateId });
  return response.data;
}

export async function setRoundCase({ roundId, caseBriefId }: { roundId: string, caseBriefId: string }) {
  const response = await api.post("/practice-round/set-case", { roundId, caseBriefId });
  return response.data;
}



export async function startRecording({ room_url }: { room_url: string }) {
  const response = await api.post("/recording/start", { room_url });
  return response.data;
}

export async function stopRecording({ room_url, roomId }: { room_url: string, roomId: string }) {
  const response = await api.post("/recording/stop", { room_url, roomId });
  return response.data;
}

export async function assessCandidatePerformance({ room_url, roomId, roundId, case_name }: { room_url: string, roomId: string, roundId: string, case_name:string }) {
  const response = await api.post("/assessment", { room_url, roomId, roundId, case_name });
  return response.data;
}