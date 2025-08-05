import { supabase } from "./client";
import type { Tables } from "./types";
import React from 'react';
import ReactMarkdown from 'react-markdown';

export type Session = Tables<"practice_sessions"> & {
  profiles?: any; // adjust as needed for joined profile info
};

export type Case = Tables<"cases">;
export type Profile = Tables<"profiles">;

/**
 * Fetch all sessions or a single session if sessionId is provided.
 * Joins profiles for host info.
 */
export const fetchSessions = async (sessionId?: string): Promise<Session[] | Session | null> => {
  let query = supabase
    .from('practice_sessions')
    .select('id, host_id, guest_id, candidate_id, case_id, datetime_utc, type, created_at, room_url, version, profiles:profiles!practice_sessions_host_id_fkey(user_id, first_name, last_name, avatar)')
    .order('datetime_utc', { ascending: true });

  if (sessionId) {
    // Fetch a single session
    const { data, error } = await query.eq('id', sessionId).single();
    if (error || !data) return null;
    return data;
  } else {
    // Fetch all sessions
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  }
};

/**
 * Fetch all cases.
 */
export const fetchCases = async (): Promise<Case[]> => {
  const { data, error } = await supabase
    .from('cases')
    .select('id, case_name, actor_brief, candidate_brief, markscheme, category, condition, domain');
  return data || [];
};

/**
 * Fetch a single profile by userId.
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from('profiles')
    .select('user_id, first_name, last_name, avatar, training_level')
    .eq('user_id', userId)
    .single();
  if (error || !data) return null;
  return data;
};

/**
 * Converts a markdown string to React elements for safe rendering in the UI.
 * Can be used for candidate_brief, actor_brief, markscheme, etc.
 * @param markdown - The markdown string to render
 * @returns React element rendering the markdown
 */
export function renderMarkdownToReact(markdown: string | undefined | null): React.ReactNode {

  if (!markdown) return null;
  // 1. Replace all literal \n with real newlines
  let normalized = markdown.replace(/\\n/g, '\n');
  // 2. Ensure there are exactly two newlines before '**Examination Findings**'
  normalized = normalized.replace(/(\n*)\*\*Examination Findings\*\*/g, '\n\n**Examination Findings**');

  // Debug: log the normalized string
  console.log('Normalized markdown:', JSON.stringify(normalized));

  return <ReactMarkdown>{normalized}</ReactMarkdown>;
}

/**
 * Subscribe to realtime changes on the practice_sessions table.
 * If sessionId is provided, only subscribe to that session; otherwise, subscribe to all.
 * Returns a cleanup function to remove the channel.
 */
export function subscribeToPracticeSessions({
  sessionId,
  onChange,
}: {
  sessionId?: string;
  onChange: () => void;
}) {
  const filter = sessionId ? `id=eq.${sessionId}` : undefined;
  const channel = supabase.channel(
    sessionId ? `practice_sessions:${sessionId}` : "practice_sessions:all"
  ).on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "practice_sessions",
      ...(filter ? { filter } : {}),
    },
    onChange
  ).subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
} 