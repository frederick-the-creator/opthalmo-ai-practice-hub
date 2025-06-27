import { supabase } from "./client";
import React from 'react';
import ReactMarkdown from 'react-markdown';

export const fetchSession = async (sessionId: string | null) => {
  if (!sessionId) return {
    hostId: null,
    guestId: null,
    candidateId: null,
    caseId: null,
    date: null,
    time: null,
    type: null,
    roomUrl: null,
    createdAt: null,
    id: null,
    version: 1,
    hostName: "Host",
    guestName: "Guest"
  };
  // Fetch session with host and guest IDs
  const { data: session, error: sessionError } = await supabase
    .from('practice_sessions')
    .select('*')
    .eq('id', sessionId)
    .single();
  if (sessionError || !session) return {
    hostId: null,
    guestId: null,
    candidateId: null,
    caseId: null,
    date: null,
    time: null,
    type: null,
    roomUrl: null,
    createdAt: null,
    id: null,
    version: 1,
    hostName: "Host",
    guestName: "Guest"
  };
  const hostId = session.host_id;
  const guestId = session.guest_id;
  const candidateId = session.candidate_id;
  const caseId = session.case_id;
  const date = session.date;
  const time = session.time;
  const type = session.type;
  const roomUrl = session.room_url;
  const createdAt = session.created_at;
  const id = session.id;
  const version = session.version;
  // Fetch host profile
  let hostNameStr = "";
  let guestNameStr = "";
  if (hostId) {
    const { data: hostProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', hostId)
      .single();
    if (hostProfile) hostNameStr = `${hostProfile.first_name} ${hostProfile.last_name}`.trim();
  }
  if (guestId) {
    const { data: guestProfile } = await supabase
      .from('profiles')
      .select('first_name, last_name')
      .eq('user_id', guestId)
      .single();
    if (guestProfile) guestNameStr = `${guestProfile.first_name} ${guestProfile.last_name}`.trim();
  }
  return {
    hostId,
    guestId,
    candidateId,
    caseId,
    date,
    time,
    type,
    roomUrl,
    createdAt,
    id,
    version,
    hostName: hostNameStr || "Host",
    guestName: guestNameStr || "Guest"
  };
};

export const fetchCases = async () => {
  const { data: casesData } = await supabase
    .from('cases')
    .select('id, case_name, actor_brief, candidate_brief, markscheme');
  return casesData || [];
};

/**
 * Converts a markdown string to React elements for safe rendering in the UI.
 * Can be used for candidate_brief, actor_brief, markscheme, etc.
 * @param markdown - The markdown string to render
 * @returns React element rendering the markdown
 */
export function renderMarkdownToReact(markdown: string | undefined | null): React.ReactNode {
  if (!markdown) return null;
  return <ReactMarkdown>{markdown}</ReactMarkdown>;
} 