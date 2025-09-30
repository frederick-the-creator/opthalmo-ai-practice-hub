import React, { useState, useEffect, useMemo } from "react";
import HeaderBar from "../components/interviewRoom/HeaderBar";
import VideoPane from "../components/interviewRoom/VideoPane";
import PrepPanel from "../components/interviewRoom/panels/PrepPanel";
import InterviewPanel from "../components/interviewRoom/panels/InterviewPanel";
import WrapUpPanel from "../components/interviewRoom/panels/WrapUpPanel";
import InterviewControls from "../components/interviewRoom/panels/InterviewPanelControls";
import { useNavigate } from "react-router-dom";
import { useInterviewRoom } from "@/hooks/useInterviewRoom";
// caseBriefs now come from useInterviewRoom

const InterviewPracticeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [updating, setUpdating] = useState(false);

  const roomId = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('roomId');
  }, []);

  // Retrieve useful functions from helper module
  const {
    room,
    round,
    roomStage,
    isHost,
    isCandidate,
    updateStage,
    error,
    setCase,
    setCandidate,
    createNewRound,
    caseBriefs,
  } = useInterviewRoom(roomId);

  useEffect(() => {
    setUpdating(false);
  }, [roomStage]);

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
  const handleAnotherRound = () => {
    setUpdating(true);
    createNewRound()
      .then(() => updateStage("Prep"))
      .finally(() => setUpdating(false));
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
  if (roomStage === "Prep") {
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
  } else if (roomStage === "Interview") {
    rightPanel = (
      <InterviewPanel
        round={round}
        cases={caseBriefs}
        isCandidate={isCandidate}
        onBack={handleBackToPrep}
      />
    );
  } else if (roomStage === "WrapUp") {
    rightPanel = (
      <WrapUpPanel
        isHost={isHost}
        onAnotherRound={handleAnotherRound}
        onFinishRoom={handleFinishRoom}
      />
    );
  }

  return (
    <div className="px-14 py-7 h-screen overflow-hidden bg-white max-md:px-5">
      <HeaderBar
        stage={roomStage ?? "Prep"}
        isHost={isHost}
        onExit={handleExit}
        onBack={
          roomStage === "Interview"
            ? handleBackToPrep
            : roomStage === "WrapUp"
            ? handleBackToInterview
            : undefined
        }
      />
      <div className="max-w-full w-full">
        <div className="flex gap-5 max-md:flex-col">
          <div className="flex-1 max-md:ml-0 max-md:w-full">
            <VideoPane roomUrl={room?.roomUrl ?? null} error={error} />
          </div>
          <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
            {rightPanel}
          </div>
        </div>
        {isHost && (roomStage === "Prep" || roomStage === "Interview") && (
          <div className="mt-4 flex justify-center">
            <InterviewControls
              room={room ?? null}
              round = {round ?? null}
              caseBriefs={caseBriefs}
              onStartCase={handleStartCase}
              canStart={Boolean(round?.candidateId && round?.caseBriefId)}
              onFinishRound={handleFinishRound}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPracticeRoom; 