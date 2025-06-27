import React from 'react';
import { Button } from '@/components/ui/button';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import Brief from '../briefs/Brief';

type InterviewPanelProps = {
  session: any;
  cases: any[];
  role: 'host' | 'guest' | null;
  isCandidate: boolean;
  updating?: boolean;
  onFinishCase: () => void;
  onBack: () => void;
};

const InterviewPanel: React.FC<InterviewPanelProps> = ({ session, cases, role, isCandidate, onFinishCase }) => {
  const foundCase = cases.find(c => c.id === session?.caseId);

  if (isCandidate) {
    return (
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <div className="gap-3 w-full text-xs leading-6 text-white max-w-[462px] max-md:max-w-full flex-shrink-0">
          <div className="gap-2.5 self-stretch w-full text-3xl font-medium leading-none text-slate-950 max-md:max-w-full">
            Candidate Brief
          </div>
        </div>
        <div className="flex-1 mt-8 max-w-full text-black w-[462px] overflow-y-auto">
          <Brief
            title="Candidate Brief"
            markdown={foundCase?.candidate_brief ?? null}
            placeholder={!session?.caseId ? 'Select a case to view the candidate brief.' : 'No candidate brief available for this case.'}
          />
          {/* Only the host sees the Proceed button */}
          {role === 'host' && (
            <div className="flex justify-center mt-8">
              <Button
                className="w-64 text-lg"
                onClick={onFinishCase}
              >
                Finish Case
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }
  // Interviewer/Actor view
  return (
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
        <Brief
          title="Actor Brief"
          markdown={foundCase?.actor_brief ?? null}
          placeholder={!session?.caseId ? 'Select a case to view the actor brief.' : 'No actor brief available for this case.'}
        />
        <Brief
          title="MarkScheme"
          markdown={foundCase?.markscheme ?? null}
          placeholder={!session?.caseId ? 'Select a case to view the markscheme.' : 'No markscheme available for this case.'}
        />
        {/* Only the host sees the Proceed button */}
        {role === 'host' && (
          <div className="flex justify-center mt-8">
            <Button
              className="w-64 text-lg"
              onClick={onFinishCase}
            >
              Finish Case
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default InterviewPanel; 