import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible";
import { ChevronDown, Play } from "lucide-react";
import { fetchCases, renderMarkdownToReact } from "@/integrations/supabase/utils";
import { useInterviewSession } from "@/hooks/useInterviewSession";
import { Stage } from "@/integrations/supabase/types";

const InterviewPracticeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [rawSessionId, setRawSessionId] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  // Parse roomUrl and sessionId from URL params
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get('sessionId');
    if (session_id) setRawSessionId(session_id);
  }, []);

  // Fetch cases
  useEffect(() => {
    fetchCases().then(setCases);
  }, []);

  // Use the centralised session hook
  const {
    session,
    stage,
    role,
    isCandidate,
    updateStage,
    setCase: setCaseDb,
    setCandidate: setCandidateDb,
    error,
  } = useInterviewSession(rawSessionId);

  // Handlers for host actions
  const handleSelectCandidate = async (userId: string) => {
    setUpdating(true);
    try {
      await setCandidateDb(userId);
    } catch {}
    setUpdating(false);
  };
  const handleSelectCase = async (caseId: string) => {
    setUpdating(true);
    try {
      await setCaseDb(caseId);
    } catch {}
    setUpdating(false);
  };
  const handleStartCase = async () => {
    setUpdating(true);
    try {
      await updateStage(Stage.INTERVIEW);
    } catch {}
    setUpdating(false);
  };
  const handleBackToVersion1 = async () => {
    setUpdating(true);
    try {
      await updateStage(Stage.PREP);
    } catch {}
    setUpdating(false);
  };
  const handleBackToVersion2 = async () => {
    setUpdating(true);
    try {
      await updateStage(Stage.INTERVIEW);
    } catch {}
    setUpdating(false);
  };
  const handleFinishCase = async () => {
    setUpdating(true);
    try {
      await updateStage(Stage.WRAP_UP);
    } catch {}
    setUpdating(false);
  };

  // --- Stage 1: Preparation ---
  if (stage === Stage.PREP) {
    return (
      <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
        <div className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
          <Button
            className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
            onClick={() => navigate("/dashboard")}
          >
            Exit
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
                  ) : session?.roomUrl ? (
                    <iframe
                      src={session.roomUrl}
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
            {/* Only show right panel if user is host */}
            {role === 'host' && (
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
                    <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md text-black">
                      <div className="flex flex-col">
                        {[{id: session?.hostId, name: session?.hostName}, {id: session?.guestId, name: session?.guestName}].map(user => (
                          <div
                            key={user.id}
                            onClick={() => handleSelectCandidate(user.id)}
                            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
                              ${session?.candidateId === user.id
                                ? 'bg-[#E5EEF3] text-[#0E5473]'
                                : 'bg-transparent text-[#0E5473] hover:bg-gray-100'}
                            `}
                            style={{ minWidth: 120 }}
                          >
                            {user.name}
                          </div>
                        ))}
                      </div>
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
                    <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md text-black">
                      <div
                        className="flex flex-col"
                        style={{
                          maxHeight: 300,
                          overflowY: "auto",
                        }}
                      >
                        {cases.map(c => (
                          <div
                            key={c.id}
                            onClick={() => handleSelectCase(c.id)}
                            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
                              ${session?.caseId === c.id
                                ? 'bg-[#E5EEF3] text-[#0E5473]'
                                : 'bg-transparent text-[#0E5473] hover:bg-gray-100'}
                            `}
                            style={{ minWidth: 120 }}
                          >
                            {c.case_name}
                          </div>
                        ))}
                      </div>
                    </div>
                  </CollapsibleContent>
                </Collapsible>
                <div className="flex justify-center mt-8">
                  <Button
                    className="flex items-center gap-2 text-lg px-6 py-3"
                    onClick={handleStartCase}
                    disabled={!session?.candidateId || !session?.caseId || updating}
                  >
                    <Play className="w-5 h-5 mr-2" /> {updating ? "Starting..." : "Start Case"}
                  </Button>
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // --- Stage 2: Interview ---
  if (stage === Stage.INTERVIEW) {
    const mainTitle = isCandidate ? "Candidate" : "Interviewer";
    const rightPanel = isCandidate ? (
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
          <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
            Candidate Brief
          </div>
        </div>
        <div className="flex-1 mt-8 max-w-full text-black w-[462px] overflow-y-auto">
          <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={true}>
            <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md" style={{ backgroundColor: "#0E5473" }}>
              <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: "white" }}>
                Candidate Brief
              </div>
              <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md">
                {(() => {
                  const found = cases.find(c => c.id === session?.caseId);
                  if (!session?.caseId) return <span>Select a case to view the candidate brief.</span>;
                  if (!found) return <span>No candidate brief available for this case.</span>;
                  return found.candidate_brief
                    ? renderMarkdownToReact(found.candidate_brief)
                    : <span>No candidate brief available for this case.</span>;
                })()}
              </div>
            </CollapsibleContent>
          </Collapsible>
          {/* Only the host sees the Proceed button */}
          {role === 'host' && (
          <div className="flex justify-center mt-8">
            <Button
              className="w-64 text-lg"
              onClick={handleFinishCase}
              disabled={updating}
            >
              Finish Case
            </Button>
          </div>
          )}
        </div>
      </div>
    ) : (
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
          <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
            Actor/Interviewer
          </div>
          <div className="mt-3 max-w-full">
            <ToggleGroup type="single" defaultValue="clinical" className="flex justify-start">
              <ToggleGroupItem value="clinical" className="text-xs font-bold px-3 py-1.5 rounded-l-md rounded-r-none data-[state=on]:bg-[#0E5473] data-[state=on]:text-white data-[state=off]:bg-[#E5EEF3] data-[state=off]:text-[#0E5473] border-0">Clinical</ToggleGroupItem>
              <ToggleGroupItem value="communication" className="text-xs font-bold px-3 py-1.5 rounded-r-md rounded-l-none data-[state=on]:bg-[#0E5473] data-[state=on]:text-white data-[state=off]:bg-[#E5EEF3] data-[state=off]:text-[#0E5473] border-0 -ml-[1px]">Communication</ToggleGroupItem>
            </ToggleGroup>
          </div>
          <div className="flex overflow-hidden flex-wrap gap-4 content-center items-center mt-3 w-full max-md:max-w-full">
            <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>Topic 1</div>
            <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>Longer Topic</div>
            <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>Really Really Long Topic</div>
            <div className="text-xs font-bold px-3 py-1.5 rounded-md bg-[#0E5473] text-white" style={{ backgroundColor: "#0E5473" }}>Topic 1</div>
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
                {(() => {
                  const found = cases.find(c => c.id === session?.caseId);
                  if (!session?.caseId) return <span>Select a case to view the actor brief.</span>;
                  if (!found) return <span>No actor brief available for this case.</span>;
                  return found.actor_brief
                    ? renderMarkdownToReact(found.actor_brief)
                    : <span>No actor brief available for this case.</span>;
                })()}
              </div>
            </CollapsibleContent>
          </Collapsible>
          <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={true}>
            <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium whitespace-nowrap max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md mt-4" style={{ backgroundColor: "#0E5473" }}>
              <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: "white" }}>
                MarkScheme
              </div>
              <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md">
                {(() => {
                  const found = cases.find(c => c.id === session?.caseId);
                  if (!session?.caseId) return <span>Select a case to view the markscheme.</span>;
                  if (!found) return <span>No markscheme available for this case.</span>;
                  return found.markscheme
                    ? renderMarkdownToReact(found.markscheme)
                    : <span>No markscheme available for this case.</span>;
                })()}
              </div>
            </CollapsibleContent>
          </Collapsible>
          {/* Only the host sees the Proceed button */}
          {role === 'host' && (
          <div className="flex justify-center mt-8">
            <Button
              className="w-64 text-lg"
              onClick={handleFinishCase}
              disabled={updating}
            >
              Finish Case
            </Button>
          </div>
          )}
        </div>
      </div>
    );

    return (
      <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
        <div className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
          <Button
            className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
            onClick={() => navigate("/dashboard")}
          >
            Exit
          </Button>
          {/* Only the host (and not the candidate) can see the Back button */}
          {role === 'host' && (
            <Button
              className="font-bold text-white bg-[#0E5473] hover:bg-[#0E5473]/90 border-none"
              onClick={handleBackToVersion1}
              disabled={updating}
            >
              Back
            </Button>
          )}
        </div>
        <div className="max-w-full w-full">
          <div className="flex gap-5 max-md:flex-col">
            <div className="flex-1 max-md:ml-0 max-md:w-full">
              <div className="w-full max-md:mt-10 max-md:max-w-full">
                <div className="overflow-hidden gap-3.5 self-stretch px-5 w-full text-3xl font-medium leading-none text-white whitespace-nowrap bg-sky-900 rounded-2xl min-h-14 max-md:max-w-full flex items-center justify-center">
                  {mainTitle}
                </div>
                <div className="flex overflow-hidden flex-col justify-center mt-5 w-full rounded-2xl border border-solid border-gray-200 h-[calc(100vh-14rem)] max-md:max-w-full">
                  {session?.roomUrl ? (
                    <iframe
                      src={session.roomUrl}
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
              {rightPanel}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Stage 3: Case End ---
  if (stage === Stage.WRAP_UP) {
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
            onClick={handleBackToVersion2}
            disabled={updating}
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
                  {session?.roomUrl ? (
                    <iframe
                      src={session.roomUrl}
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
            {/* Only show right panel if user is host */}
            {role === 'host' && (
            <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
              <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full justify-center">
                <Button className="mb-4 w-64 text-lg self-center" onClick={() => navigate("/dashboard")}>Finish</Button>
                <Button className="mb-4 w-64 text-lg self-center" variant="outline" onClick={handleBackToVersion1}
                >Do Another Case</Button>
                <Button className="w-64 text-lg self-center" variant="secondary">Transcript Review</Button>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Fallback for unexpected state
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-white">
      <div className="text-2xl font-bold text-red-600 mb-4">Something went wrong</div>
      <div className="text-gray-700 mb-6">
        We couldn't load your interview room. Please try again or return to the dashboard.
      </div>
      <Button onClick={() => navigate('/dashboard')}>Go to Dashboard</Button>
    </div>
  );
};

export default InterviewPracticeRoom;