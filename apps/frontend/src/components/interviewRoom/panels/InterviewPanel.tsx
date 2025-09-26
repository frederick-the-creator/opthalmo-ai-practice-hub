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
  const selectedCase = cases.find(c => c.id === round?.case_brief_id);

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
            markdown={selectedCase?.candidate_brief ?? null}
            placeholder={!round?.case_brief_id ? 'Select a case to view the candidate brief.' : 'No candidate brief available for this case.'}
          />
          {/* Controls moved to InterviewPracticeround */}
        </div>
      </div>
    );
  }
  // Interviewer/Actor view
  const [actorOpen, setActorOpen] = useState(true);
  const [markOpen, setMarkOpen] = useState(false);
  const handleActorChange = useCallback((open: boolean) => {
    setActorOpen(open);
    if (open) setMarkOpen(false);
  }, []);
  const handleMarkChange = useCallback((open: boolean) => {
    setMarkOpen(open);
    if (open) setActorOpen(false);
  }, []);
  return (// 
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
      <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
        <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
        {selectedCase?.case_name}
        </div>
      </div>
      <div className="flex-1 mt-2 max-w-full text-black w-[462px] flex flex-col min-h-0">
        {/* Controlled toggles to keep only one open */}
        <div className={actorOpen ? "flex-1 min-h-0 flex flex-col" : "flex-none"}>
          <Brief
            title="Actor Brief"
            markdown={selectedCase?.actor_brief ?? null}
            placeholder={!round?.case_brief_id ? 'Select a case to view the actor brief.' : 'No actor brief available for this case.'}
            open={actorOpen}
            onOpenChange={handleActorChange}
          />
        </div>
      </div>
    </div>
  );
};

export default InterviewPanel; 