import { supabase } from "./client";

export const fetchSessionAndCases = async (sessionId: string | null) => {
  if (!sessionId) return {
    hostId: null,
    guestId: null,
    candidateId: null,
    version: 1,
    hostName: "Host",
    guestName: "Guest",
    cases: []
  };
  // Fetch session with host and guest IDs
  const { data: session, error: sessionError } = await supabase
    .from('practice_sessions')
    .select('host_id, guest_id, candidate_id, version')
    .eq('id', sessionId)
    .single();
  if (sessionError || !session) return {
    hostId: null,
    guestId: null,
    candidateId: null,
    version: 1,
    hostName: "Host",
    guestName: "Guest",
    cases: []
  };
  const hostId = session.host_id;
  const guestId = session.guest_id;
  const candidateId = session.candidate_id;
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
  // Fetch cases
  const { data: casesData } = await supabase
    .from('cases')
    .select('id, name');
  return {
    hostId,
    guestId,
    candidateId,
    version,
    hostName: hostNameStr || "Host",
    guestName: guestNameStr || "Guest",
    cases: casesData || []
  };
}; 