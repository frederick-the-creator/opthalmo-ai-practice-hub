import React, { useState, useEffect } from "react";
import HeaderBar from "./HeaderBar";
import VideoPane from "./VideoPane";
import PrepPanel from "./panels/PrepPanel";
import InterviewPanel from "./panels/InterviewPanel";
import WrapUpPanel from "./panels/WrapUpPanel";
import { useNavigate } from "react-router-dom";
import { useInterviewSession } from "@/pages/interview-room/useInterviewSession";
import { fetchCases } from "@/integrations/supabase/utils";
import { Stage } from "@/integrations/supabase/types";

const InterviewPracticeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [rawSessionId, setRawSessionId] = useState<string | null>(null);
  const [cases, setCases] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const session_id = params.get('sessionId');
    if (session_id) setRawSessionId(session_id);
  }, []);

  useEffect(() => {
    fetchCases().then(setCases);
  }, []);

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

  useEffect(() => {
    setUpdating(false);
  }, [stage]);

  // Handlers for host actions
  const handleSelectCandidate = (userId: string) => {
    setUpdating(true);
    setCandidateDb(userId).finally(() => setUpdating(false));
  };
  const handleSelectCase = (caseId: string) => {
    setUpdating(true);
    setCaseDb(caseId).finally(() => setUpdating(false));
  };
  const handleStartCase = () => {
    setUpdating(true);
    updateStage(Stage.INTERVIEW).finally(() => setUpdating(false));
  };
  const handleBackToPrep = () => {
    setUpdating(true);
    updateStage(Stage.PREP).finally(() => setUpdating(false));
  };
  const handleBackToInterview = () => {
    setUpdating(true);
    updateStage(Stage.INTERVIEW).finally(() => setUpdating(false));
  };
  const handleFinishCase = () => {
    setUpdating(true);
    updateStage(Stage.WRAP_UP).finally(() => setUpdating(false));
  };

  // Navigation handlers
  const handleExit = () => navigate("/dashboard");

  // Panel selection
  let rightPanel = null;
  if (stage === Stage.PREP) {
    rightPanel = (
      <PrepPanel
        session={session}
        cases={cases}
        role={role}
        updating={updating}
        onSelectCandidate={handleSelectCandidate}
        onSelectCase={handleSelectCase}
        onStartCase={handleStartCase}
      />
    );
  } else if (stage === Stage.INTERVIEW) {
    rightPanel = (
      <InterviewPanel
        session={session}
        cases={cases}
        role={role}
        isCandidate={isCandidate}
        onFinishCase={handleFinishCase}
        onBack={handleBackToPrep}
      />
    );
  } else if (stage === Stage.WRAP_UP) {
    rightPanel = (
      <WrapUpPanel
        role={role}
        onExit={handleExit}
        onDoAnother={handleBackToPrep}
        onTranscript={() => {}}
      />
    );
  }

  return (
    <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
      <HeaderBar
        stage={stage}
        role={role}
        onExit={handleExit}
        onBack={
          stage === Stage.INTERVIEW
            ? handleBackToPrep
            : stage === Stage.WRAP_UP
            ? handleBackToInterview
            : undefined
        }
      />
      <div className="max-w-full w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex-1 max-md:ml-0 max-md:w-full">
            <VideoPane roomUrl={session?.roomUrl ?? null} error={error} />
          </div>
          <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
            {rightPanel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default InterviewPracticeRoom; 