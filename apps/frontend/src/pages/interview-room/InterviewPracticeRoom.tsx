import React, { useState, useEffect, useMemo } from "react";
import HeaderBar from "./components/HeaderBar";
import VideoPane from "./components/VideoPane";
import PrepPanel from "./components/panels/PrepPanel";
import InterviewPanel from "./components/panels/InterviewPanel";
import WrapUpPanel from "./components/panels/WrapUpPanel";
import InterviewControls from "./components/panels/InterviewPanelControls";
import { useNavigate } from "react-router-dom";
import { assessCandidatePerformance } from "@/lib/api";
import { useInterviewRoom } from "@/pages/interview-room/useInterviewRoom";
import { fetchCaseBriefs } from "@/supabase/utils";
import { Stage } from "./types";

const InterviewPracticeRoom: React.FC = () => {
  const navigate = useNavigate();
  const [rawRoomId, setrawRoomId] = useState<string | null>(null);
  const [caseBriefs, setCaseBriefs] = useState<any[]>([]);
  const [updating, setUpdating] = useState(false);

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
  } = useInterviewRoom(rawRoomId);

  // Set caseBriefs as all available case briefs filtered on room case type
  useEffect(() => {
    if (!room) return;
    fetchCaseBriefs().then(
      fetched => {
      const filteredCaseBriefs = fetched.filter(c => {
        const type = c?.type;
        if (type === 'Clinical / Communication') return true;
        if (room.type === 'Clinical') return type === 'Clinical';
        if (room.type === 'Communication') return type === 'Communication';
        return true;
      })
      const sortedCaseBriefs = filteredCaseBriefs.sort((a, b) => {
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
  }, [room]);

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

  const handleTranscript = async () => {
    if (!room?.room_url || !room?.id) return;
    try {
      const roundCase = caseBriefs.find(c => c.id === round?.case_brief_id)
      await assessCandidatePerformance({ room_url: room.room_url, roomId: room.id, case_name: roundCase.case_name});
    } catch (e) {
      // Non-blocking: user is navigating away; errors can be surfaced via toasts if desired
      console.error('Failed to start transcription', e);
    }
  };

  // Panel selection
  let rightPanel = null;
  if (stage === Stage.PREP) {
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
  } else if (stage === Stage.INTERVIEW) {
    rightPanel = (
      <InterviewPanel
        round={round}
        cases={caseBriefs}
        isHost={isHost}
        isCandidate={isCandidate}
        onFinishCase={handleFinishCase}
        onBack={handleBackToPrep}
      />
    );
  } else if (stage === Stage.WRAP_UP) {
    rightPanel = (
      <WrapUpPanel
        isHost={isHost}
        onExit={handleExit}
        onDoAnother={handleBackToPrep}
        onTranscript={handleTranscript}
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
            <VideoPane roomUrl={room?.room_url ?? null} error={error} />
          </div>
          <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
            {rightPanel}
          </div>
        </div>
        {isHost === 'host' && (stage === Stage.PREP || stage === Stage.INTERVIEW) && (
          <div className="mt-4 flex justify-center">
            <InterviewControls
              roomUrl={room?.room_url ?? null}
              roomId={room?.id ?? null}
              stage={stage}
              onStartCase={handleStartCase}
              canStart={Boolean(round?.candidate_id && round?.case_brief_id)}
              onFinishCase={handleFinishCase}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPracticeRoom; 