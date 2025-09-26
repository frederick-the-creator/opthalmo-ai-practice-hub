import React, { useState, useEffect, useMemo } from "react";
import HeaderBar from "../components/interviewRoom/HeaderBar";
import VideoPane from "../components/interviewRoom/VideoPane";
import PrepPanel from "../components/interviewRoom/panels/PrepPanel";
import InterviewPanel from "../components/interviewRoom/panels/InterviewPanel";
import WrapUpPanel from "../components/interviewRoom/panels/WrapUpPanel";
import InterviewControls from "../components/interviewRoom/panels/InterviewPanelControls";
import { useNavigate } from "react-router-dom";
import { useInterviewRoom } from "@/hooks/useInterviewRoom";
import { fetchCaseBriefs } from "@/supabase/data";

const InterviewPracticeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [rawRoomId, setrawRoomId] = useState<string | null>(null);
  const [caseBriefs, setCaseBriefs] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

  console.log('updating:', updating)
  // Set rawRoomId
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const room_id = params.get('roomId');
    if (room_id) setrawRoomId(room_id);
  }, []);

  // Retrieve useful functions from helper module
  const {
    room,
    round,
    stage,
    isHost,
    isCandidate,
    updateStage,
    error,
    setCase,
    setCandidate,
    roundNumber,
    setRoundNumber
  } = useInterviewRoom(rawRoomId);

  // Load all case briefs (filtering now handled in PrepPanel)
  useEffect(() => {
    fetchCaseBriefs().then(
      fetched => {
      const sortedCaseBriefs = fetched.sort((a, b) => {
        const aName = (a?.case_name ?? '').toString();
        const bName = (b?.case_name ?? '').toString();
        const cmp = aName.localeCompare(bName, undefined, { sensitivity: 'base' });
        if (cmp !== 0) return cmp;
        const aId = (a?.id ?? '').toString();
        const bId = (b?.id ?? '').toString();
        return aId.localeCompare(bId);
      })
      setCaseBriefs(sortedCaseBriefs);
    });
  }, []);

  useEffect(() => {
    setUpdating(false);
  }, [stage]);

  // Handlers for host actions
  const handleSelectCandidate = (roundId: string, userId: string) => {
    setUpdating(true);
    setCandidate(roundId, userId).finally(() => setUpdating(false));
  };
  const handleSelectCase = (roundId: string, caseBriefId: string) => {
    setUpdating(true);
    setCase(roundId, caseBriefId).finally(() => setUpdating(false));
  };
  const handleStartCase = () => {
    console.log('handleStartCase triggered')
    setUpdating(true);
    updateStage("Interview").finally(() => setUpdating(false));
  };
  const handleBackToPrep = () => {
    setUpdating(true);
    updateStage("Prep").finally(() => setUpdating(false));
  };
  const handleBackToInterview = () => {
    setUpdating(true);
    updateStage("Interview").finally(() => setUpdating(false));
  };
  const handleFinishRound = () => {
    setUpdating(true);
    updateStage("WrapUp").finally(() => setUpdating(false));
  };
  const handleNextRound = () => {
    setUpdating(true);
    setRoundNumber(2)
    updateStage("Prep").finally(() => setUpdating(false));
  };
  const handleFinishRoom = () => {
    setUpdating(true);
    updateStage("Finished").finally(() => setUpdating(false));
    navigate("/dashboard");
  };

  // Navigation handlers
  const handleExit = () => navigate("/dashboard");

  // Panel selection
  let rightPanel = null;
  if (stage === "Prep") {
    rightPanel = (
      <PrepPanel
        room={room}
        round={round}
        cases={caseBriefs}
        isHost={isHost}
        updating={updating}
        onSelectCandidate={handleSelectCandidate}
        onSelectCase={handleSelectCase}
      />
    );
  } else if (stage === "Interview") {
    rightPanel = (
      <InterviewPanel
        round={round}
        cases={caseBriefs}
        isCandidate={isCandidate}
        onBack={handleBackToPrep}
      />
    );
  } else if (stage === "WrapUp") {
    rightPanel = (
      <WrapUpPanel
        isHost={isHost}
        roundNumber={roundNumber}
        onNextRound={handleNextRound}
        onFinishRoom={handleFinishRoom}
      />
    );
  }

  return (
    <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
      <HeaderBar
        stage={stage}
        isHost={isHost}
        onExit={handleExit}
        onBack={
          stage === "Interview"
            ? handleBackToPrep
            : stage === "WrapUp"
            ? handleBackToInterview
            : undefined
        }
      />
      <div className="max-w-full w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex-1 max-md:ml-0 max-md:w-full">
            <VideoPane roomUrl={room?.room_url ?? null} error={error} />
          </div>
          <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
            {rightPanel}
          </div>
        </div>
        {isHost === 'host' && (stage === "Prep" || stage === "Interview") && (
          <div className="mt-4 flex justify-center">
            <InterviewControls
              room={room ?? null}
              round = {round ?? null}
              caseBriefs={caseBriefs}
              stage={stage}
              onStartCase={handleStartCase}
              canStart={Boolean(round?.candidate_id && round?.case_brief_id)}
              onFinishRound={handleFinishRound}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPracticeRoom; 