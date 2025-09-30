import React, { useState, useCallback } from 'react';
import Brief from './PanelBriefs';

type InterviewPanelProps = {
  round: any;
  cases: any[];
  isCandidate: boolean;
  updating?: boolean;
  onBack: () => void;
};

const InterviewPanel: React.FC<InterviewPanelProps> = ({ round, cases, isCandidate }) => {
  const selectedCase = cases.find(c => c.id === round?.caseBriefId);

  if (isCandidate) {
    return (
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
          <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
            {selectedCase?.category}
          </div>
        </div>
        <div className="flex-1 mt-2 max-w-full text-black w-[462px]">
          <Brief
            title="Candidate Brief"
            markdown={selectedCase?.candidateBrief ?? null}
            placeholder={!round?.caseBriefId ? 'Select a case to view the candidate brief.' : 'No candidate brief available for this case.'}
          />
          {/* Controls moved to InterviewPracticeround */}
        </div>
      </div>
    );
  }
  // Interviewer/Actor view
  const [actorOpen, setActorOpen] = useState(true);
  const handleActorChange = useCallback((open: boolean) => {
    setActorOpen(open);
  }, []);
  return (// 
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
      <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
        <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
        {selectedCase?.caseName}
        </div>
      </div>
      <div className="flex-1 mt-2 max-w-full text-black w-[462px] flex flex-col min-h-0">
        {/* Controlled toggles to keep only one open */}
        <div className={actorOpen ? "flex-1 min-h-0 flex flex-col" : "flex-none"}>
          <Brief
            title="Actor Brief"
            markdown={selectedCase?.actorBrief ?? null}
            placeholder={!round?.caseBriefId ? 'Select a case to view the actor brief.' : 'No actor brief available for this case.'}
            open={actorOpen}
            onOpenChange={handleActorChange}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel; 