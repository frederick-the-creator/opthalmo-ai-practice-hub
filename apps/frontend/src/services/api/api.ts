import axios from "axios";
import { supabase } from "@/utils/supabaseClient";

// Base API URL - update this to point to your actual backend API
const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000";
const API_BASE_URL = `${RAW_API_BASE_URL.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});


// Attach Authorization header with current Supabase access token on all requests
api.interceptors.request.use(async (config) => {
  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (accessToken) {
      config.headers = {
        ...(config.headers as any),
        Authorization: `Bearer ${accessToken}`,
      };
    }
  } catch (_e) {}
  return config;
});


export async function createRoom({ hostId, startUtc, private: isPrivate, durationMinutes }: { hostId: string, startUtc: string, private: boolean, durationMinutes: number }) {

  const createFields = { hostId, startUtc, private: isPrivate, durationMinutes }

  const response = await api.post("/practice-room/create", { createFields });
  return response.data;
}

export async function setRoomGuest({ roomId, guestId }: { roomId: string, guestId: string }) {
  const updateFields = {roomId, guestId}
  const response = await api.post("/practice-room/update", { updateFields });
  return response.data;
}

export async function setRoomStage({ roomId, stage }: { roomId: string, stage: string }) {
  const updateFields = { roomId, stage }
  const { data } = await api.post("/practice-room/update", { updateFields });
  return data.room;
}

export async function rescheduleRoom({ roomId, startUtc }: { roomId: string, startUtc: string }) {
  const updateFields = { roomId, startUtc };
  const { data } = await api.post("/practice-room/update", { updateFields });
  return data.room;
}

export async function createRound({ roomId, roundNumber }: { roomId: string, roundNumber: number }) {
  const createFields = { roomId, roundNumber }
  const { data } = await api.post("/practice-round/create", { createFields });
  return data.round;
}


export async function setRoundCandidate({ roundId, candidateId }: { roundId: string, candidateId: string }) {
  const updateFields = { roundId, candidateId }
  const { data } = await api.post("/practice-round/update", { updateFields });
  return data.round;
}

export async function setRoundCase({ roundId, caseBriefId }: { roundId: string, caseBriefId: string }) {
  const updateFields = { roundId, caseBriefId }
  const { data } = await api.post("/practice-round/update", { updateFields });
  return data.round;
}


export async function startRecording({ roomUrl }: { roomUrl: string }) {
  const response = await api.post("/recording/start", { roomUrl });
  return response.data;
}

export async function stopRecording({ roomUrl, roomId }: { roomUrl: string, roomId: string }) {
  const response = await api.post("/recording/stop", { roomUrl, roomId });
  return response.data;
}

export async function assessCandidatePerformance({ roomUrl, roomId, roundId, caseName }: { roomUrl: string, roomId: string, roundId: string, caseName:string }) {
  const response = await api.post("/assessment", { roomUrl, roomId, roundId, caseName });
  return response.data;
}

export async function createProfile({ userId, firstName, lastName, avatar }: { userId: string; firstName: string; lastName: string; avatar?: string | null }) {
  const createFields = { userId, firstName, lastName, avatar };
  const { data } = await api.post("/profile/create", { createFields });
  return data.profile;
}

export async function updateProfile({ userId, firstName, lastName, avatar }: { userId: string; firstName?: string; lastName?: string; avatar?: string | null }) {
  const updateFields = { userId, firstName, lastName, avatar };
  const { data } = await api.post("/profile/update", { updateFields });
  return data.profile;
}

export async function cancelRoom(roomId: string) {
  const { data } = await api.delete(`/practice-room/${roomId}`);
  return data as { deleted: true; roomId: string };
}