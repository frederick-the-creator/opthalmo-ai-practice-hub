import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const InterviewPracticeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [version, setVersion] = useState<1 | 2 | 3>(1);

  // New state for session and cases
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [hostName, setHostName] = useState<string>("");
  const [guestName, setGuestName] = useState<string>("");
  const [cases, setCases] = useState<{ id: string; name: string }[]>([]);

  const [selectedCandidate, setSelectedCandidate] = useState<string | null>(null);
  const [selectedCase, setSelectedCase] = useState<string | null>(null);
  const [updating, setUpdating] = useState(false);

  const [hostId, setHostId] = useState<string | null>(null);
  const [guestId, setGuestId] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const url = params.get('roomUrl');
    const session_id = params.get('sessionId');
    if (url) {
      setRoomUrl(url);
    } else {
      setError('No meeting room URL provided.');
    }
    if (session_id) {
      setSessionId(session_id);
    }
  }, []);

  // Fetch session info and cases
  useEffect(() => {
    const fetchSessionAndCases = async () => {
      if (!sessionId) return;
      // Fetch session with host and guest IDs
      const { data: session, error: sessionError } = await supabase
        .from('practice_sessions')
        .select('host_id, guest_id')
        .eq('id', sessionId)
        .single();
      if (sessionError || !session) return;
      setHostId(session.host_id);
      setGuestId(session.guest_id);
      // Fetch host profile
      let hostNameStr = "";
      let guestNameStr = "";
      if (session.host_id) {
        const { data: hostProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', session.host_id)
          .single();
        if (hostProfile) hostNameStr = `${hostProfile.first_name} ${hostProfile.last_name}`.trim();
      }
      if (session.guest_id) {
        const { data: guestProfile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('user_id', session.guest_id)
          .single();
        if (guestProfile) guestNameStr = `${guestProfile.first_name} ${guestProfile.last_name}`.trim();
      }
      setHostName(hostNameStr || "Host");
      setGuestName(guestNameStr || "Guest");
      // Fetch cases
      const { data: casesData } = await supabase
        .from('cases')
        .select('id, name');
      setCases(casesData || []);
    };
    fetchSessionAndCases();
  }, [sessionId]);

  // Handler for Start Case
  const handleStartCase = async () => {
    if (!sessionId || !selectedCandidate || !selectedCase) return;
    setUpdating(true);
    try {
      const response = await fetch("http://localhost:4000/api/update-session-meta", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          candidate_id: selectedCandidate,
          case_id: selectedCase,
        }),
      });
      if (!response.ok) {
        setError("Failed to update session with candidate and case.");
        setUpdating(false);
        return;
      }
      setVersion(2); // Proceed to interview phase
    } catch (err) {
      setError("Failed to update session with candidate and case.");
    } finally {
      setUpdating(false);
    }
  };

  // --- Version 1: Preparation ---
  if (version === 1) {
    return (
      <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
        <div className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
          <Button
            className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
            onClick={() => navigate("/dashboard")}
          >
            Exit
          </Button>
          <Button
            className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>
        <div className="max-w-full w-full">
          <div className="flex gap-5 max-md:flex-col">
            <div className="flex-1 max-md:ml-0 max-md:w-full">
              <div className="w-full max-md:mt-10 max-md:max-w-full">
                <div className="overflow-hidden gap-3.5 self-stretch px-5 w-full text-3xl font-medium leading-none text-white whitespace-nowrap bg-sky-900 rounded-2xl min-h-14 max-md:max-w-full flex items-center justify-center">
                  Preparation
                </div>
                <div className="flex overflow-hidden flex-col justify-center mt-5 w-full rounded-2xl border border-solid border-gray-200 h-[calc(100vh-14rem)] max-md:max-w-full">
                  {error ? (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-red-500">{error}</div>
                    </div>
                  ) : roomUrl ? (
                    <iframe
                      src={roomUrl}
                      title="Video Call"
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      style={{ width: "100%", height: "100%", border: 0, borderRadius: "1rem" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-gray-400 text-lg">Loading meeting room...</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
              <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
                <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={true}>
                  <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md" style={{ backgroundColor: "#0E5473" }}>
                    <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: "white" }}>
                      Please confirm who will be the candidate
                    </div>
                    <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md bg-gray-100 text-black">
                      <label>
                        <input
                          type="radio"
                          name="candidate"
                          value={hostId || ''}
                          checked={selectedCandidate === hostId}
                          onChange={() => setSelectedCandidate(hostId)}
                        />
                        {hostName}
                      </label>
                      <label>
                        <input
                          type="radio"
                          name="candidate"
                          value={guestId || ''}
                          checked={selectedCandidate === guestId}
                          onChange={() => setSelectedCandidate(guestId)}
                        />
                        {guestName}
                      </label>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={true}>
                  <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium whitespace-nowrap max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md mt-4" style={{ backgroundColor: "#0E5473" }}>
                    <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: "white" }}>
                      Please select your case
                    </div>
                    <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md bg-gray-100 text-black">
                      {cases.map(c => (
                        <label key={c.id} style={{ display: 'block', marginBottom: 4 }}>
                          <input
                            type="radio"
                            name="case"
                            value={c.id}
                            checked={selectedCase === c.id}
                            onChange={() => setSelectedCase(c.id)}
                          />
                          {c.name}
                        </label>
                      ))}
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-center mt-8">
                  <Button
                    className="flex items-center gap-2 text-lg px-6 py-3"
                    onClick={handleStartCase}
                    disabled={!selectedCandidate || !selectedCase || updating}
                  >
                    <Play className="w-5 h-5 mr-2" /> {updating ? "Starting..." : "Start Case"}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Version 3: Case End ---
  if (version === 3) {
    return (
      <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
        <div className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
          <Button
            className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
            onClick={() => navigate("/dashboard")}
          >
            Exit
          </Button>
          <Button
            className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
            onClick={() => navigate(-1)}
          >
            Back
          </Button>
        </div>
        <div className="max-w-full w-full">
          <div className="flex gap-5 max-md:flex-col">
            <div className="flex-1 max-md:ml-0 max-md:w-full">
              <div className="w-full max-md:mt-10 max-md:max-w-full">
                <div className="overflow-hidden gap-3.5 self-stretch px-5 w-full text-3xl font-medium leading-none text-white whitespace-nowrap bg-sky-900 rounded-2xl min-h-14 max-md:max-w-full flex items-center justify-center">
                  Case End
                </div>
                <div className="flex overflow-hidden flex-col justify-center mt-5 w-full rounded-2xl border border-solid border-gray-200 h-[calc(100vh-14rem)] max-md:max-w-full">
                  {roomUrl ? (
                    <iframe
                      src={roomUrl}
                      title="Video Call"
                      allow="camera; microphone; fullscreen; speaker; display-capture"
                      style={{ width: "100%", height: "100%", border: 0, borderRadius: "1rem" }}
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-gray-400 text-lg">Video area (case ended)</div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
              <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full justify-center">
                <Button className="mb-4 w-64 text-lg self-center" onClick={() => navigate("/dashboard")}>Finish</Button>
                <Button className="mb-4 w-64 text-lg self-center" variant="outline" onClick={() => setVersion(1)}>Do Another Case</Button>
                <Button className="w-64 text-lg self-center" variant="secondary">Transcript Review</Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Version 2: Interview (default) ---
  return (
    <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
      <div className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
        <Button
          className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
          onClick={() => navigate("/dashboard")}
        >
          Exit
        </Button>
        <Button
          className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
          onClick={() => navigate(-1)}
        >
          Back
        </Button>
      </div>
      <div className="max-w-full w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex-1 max-md:ml-0 max-md:w-full">
            <div className="w-full max-md:mt-10 max-md:max-w-full">
              <div className="overflow-hidden gap-3.5 self-stretch px-5 w-full text-3xl font-medium leading-none text-white whitespace-nowrap bg-sky-900 rounded-2xl min-h-14 max-md:max-w-full flex items-center justify-center">
                Interviewer
              </div>
              <div className="flex overflow-hidden flex-col justify-center mt-5 w-full rounded-2xl border border-solid border-gray-200 h-[calc(100vh-14rem)] max-md:max-w-full">
                {roomUrl ? (
                  <iframe
                    src={roomUrl}
                    title="Video Call"
                    allow="camera; microphone; fullscreen; speaker; display-capture"
                    style={{ width: "100%", height: "100%", border: 0, borderRadius: "1rem" }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-gray-400 text-lg">Loading meeting room...</div>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
            <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
              <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
                <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
                  Giant Cell Arteris (GCA)
                </div>
                <div className="mt-3 max-w-full">
                  <ToggleGroup
                    type="single"
                    defaultValue="clinical"
                    className="flex justify-start"
                  >
                    <ToggleGroupItem
                      value="clinical"
                      className="text-xs font-bold px-3 py-1.5 rounded-l-md rounded-r-none data-[state=on]:bg-[#0E5473] data-[state=on]:text-white data-[state=off]:bg-[#E5EEF3] data-[state=off]:text-[#0E5473] border-0"
                    >
                      Clinical
                    </ToggleGroupItem>
                    <ToggleGroupItem
                      value="communication"
                      className="text-xs font-bold px-3 py-1.5 rounded-r-md rounded-l-none data-[state=on]:bg-[#0E5473] data-[state=on]:text-white data-[state=off]:bg-[#E5EEF3] data-[state=off]:text-[#0E5473] border-0 -ml-[1px]"
                    >
                      Communication
                    </ToggleGroupItem>
                  </ToggleGroup>
                </div>
                <div className="flex overflow-hidden flex-wrap gap-4 content-center items-center mt-3 w-full max-md:max-w-full">
                  <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>
                    Topic 1
                  </div>
                  <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>
                    Longer Topic
                  </div>
                  <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>
                    Really Really Long Topic
                  </div>
                  <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>
                    Topic 1
                  </div>
                </div>
              </div>
              <div className="flex-1 mt-8 max-w-full text-black w-[462px] overflow-y-auto">
                <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={true}>
                  <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md" style={{ backgroundColor: "#0E5473" }}>
                    <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: "white" }}>
                      Actor Brief
                    </div>
                    <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md">
                      You are Mary Jones, a 54 year old. You were ea6ng your
                      breakfast when your usual headache came on today, only this
                      6me it was followed by loss of vision in your right eye. You
                      presented as that has never happened before. You have been
                      having headaches for the past few days now, but ini6ally had
                      abributed it to your migraine which bothers you a few 6mes a
                      year. With these migraines, you oPen experience visual
                      changes in the form of zigzag lines. You have never lost
                      your vision like this before and want to get it checked out
                      for reassurance, though you are sure it's probably nothing
                      and just your usual migraine.
                      <br />
                      When the candidate explains that this is GCA and not your
                      usual migraine, become very anxious and flustered. Ask
                      repeatedly when you will get your eyesight back. Cling onto
                      any expression of doubt the candidate has about this
                      condi6on or its prognosis. If the candidate appears unsure
                      or provides a weak explana6on, demand that you 'hear it
                      directly' from their consultant and not 'someone who doesn't
                      even seem sure of what they're saying'. If the candidate
                      explains clearly and empathe6cally, accept the diagnosis.
                      <br />5<br />
                      When the candidate explains the need for steroid tablets,
                      start to ques/on what the point is in 'these drugs' if your
                      vision is already gone. You are worried about the side
                      effects of steroids as your mother had kidney failure
                      secondary to 'an6-inflammatories' for her period pains and
                      you do not want that to happen to you. If the candidate does
                      not explain that they are to protect the other eye, refuse
                      to take tablets. If the candidate explains the above, ask
                      further about effects on kidneys and most common side
                      effects.
                      <br />
                      Other informa6on:
                      <br />▪ No other eye condi6ons.
                      <br />▪ You have been feeling run down and 6red lately with
                      a variety of aches and pains in your shoulder, though you
                      thought it was just part of the menopause.
                      <br />▪ You experience migraines with aura (visual
                      scin6lla6ons) four 6mes a year but your visual symptoms oPen
                      resolve within the hour.
                      <br />▪ You do not take medica6ons for your migraines as you
                      are worried about side effects.
                      <br />▪ You smoke 15/day and do not drink alcohol.
                      <br />▪ You are a housewife and live with your husband. You
                      do not drive.
                      <br />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={true}>
                  <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium whitespace-nowrap max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md" style={{ backgroundColor: "#0E5473" }}>
                    <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: "white" }}>
                      MarkScheme
                    </div>
                    <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md">
                      Rapport, listening and introduction
                      <br />▪ Appropriately introduced with name and grade.
                      Confirms patient's ID.
                      <br />▪ Checks understanding of what has happened so far.
                      <br />▪ Allows the patient to speak uninterrupted.
                      <br />▪ Actively listens and acknowledges what the patient
                      is saying.
                      <br />▪ Responds appropriately to concerns.
                      <br />
                      <span className="font-medium">Apology and empathy</span>
                      <br />▪ Provides a warning shot before breaking bad news
                      e.g. "I've discussed your case with
                      <br />
                      my consultant and I'm afraid I have some bad news.."
                      <br />▪ Pauses after breaking bad news.
                      <br />▪ Shows empathy by acknowledging the patient's anxiety
                      and surprise.
                      <br />▪ Asks about any concerns / effects this diagnosis may
                      have on personal life.
                      <br />
                      Medical explanation and plan
                      <br />
                      Explains GCA is inflammation of critical arteries supplying
                      nerves at the back of the eye
                      <br />
                      responsible for vision, and this results in damage to them.
                      <br />▪ Explains treatment is in the form of steroid
                      tablets.
                      <br />▪ Emphasises this is to protect the other eye.
                      <br />▪ Reassures kidney side effects are uncommon.
                      <br />▪ Most common side effects could include: mood
                      changes, weight gain and
                      <br />
                      increased appetite, dysregulated blood sugar levels.
                      <br />▪ Appropriate follow up:
                      <br />▪ Refers to rheumatologists / medics and explains more
                      tests will be conducted
                      <br />
                      with them.
                      <br />▪ Offers follow-up in eye clinic to ease worries and
                      answer further questions.
                      <br />▪ Offers referral to eye clinic liaison officers who
                      can aid with coming to terms with
                      <br />
                      sudden change in vision.
                      <br />▪ Offers patient information leaflets.
                      <br /> Safety netting advice.
                      <br />
                      Honesty and transparency
                      <br />▪ Honest about diagnosis.
                      <br />▪ Honest about poor prognosis.
                      <br />▪ Offers to ask the consultant to speak to the patient
                      at the end of consultation if the
                      <br />
                      patient continues to show disbelief.
                      <br />
                      Appropriate pace, non-verbal
                      <br />▪ Good eye contact (with camera if virtual).
                      <br />▪ Chunk and check technique (delivering small amounts
                      of information and checking
                      <br />
                      understanding).
                      <br />
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-center mt-8">
                  <Button className="w-64 text-lg" onClick={() => setVersion(3)}>
                    Proceed
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPracticeRoom;