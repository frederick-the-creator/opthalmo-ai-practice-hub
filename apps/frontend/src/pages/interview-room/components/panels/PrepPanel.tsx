import React from 'react';
import Brief from './PanelBriefs';
import { useInterviewRoom } from "@/pages/interview-room/useInterviewRoom";

type PrepPanelProps = {
  room: any;
  round: any;
  cases: any[];
  isHost: 'host' | 'guest' | null;
  updating?: boolean;
  onSelectCandidate: (roundId: string, candidateId: string) => void;
  onSelectCase: (roundId: string, caseId: string) => void;
};


const PrepPanel: React.FC<PrepPanelProps> = ({ room, round, cases, isHost, onSelectCandidate, onSelectCase }) => {


  // Create array of candidates to select from
  const candidates = [
    room?.host_id
      ? {
          id: room.host_id,
          name:`${room.host_profile.first_name || ''} ${room.host_profile.last_name || ''}`.trim()
        }
      : null,
    room?.guest_id
      ? {
          id: room.guest_id,
          name:`${room.guest_profile.first_name || ''} ${room.guest_profile.last_name || ''}`.trim()
        }
      : null,
  ].filter(Boolean);

  const candidateContent = (
    <div className="flex flex-col">
      {candidates.map(user => {
        return (
          <div
            key={user.id}
            onClick={() => onSelectCandidate(round.id, user.id)}
            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
              ${round?.candidate_id === user.id
                ? 'bg-primary-foreground text-black'
                : 'bg-transparent text-black hover:bg-gray-100'}
            `}
            style={{ minWidth: 120 }}
          >
            {user.name}
          </div>
        );
      })}
    </div>
  );

  const caseContent = (
    <div className="flex flex-col">
      {cases.map(c => {
        return (
          <div
            key={c.id}
            onClick={() => onSelectCase(round.id, c.id)}
            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
              ${round?.case_brief_id === c.id
                ? 'bg-primary-foreground text-black'
                : 'bg-transparent text-black hover:bg-gray-100'}
            `}
            style={{ minWidth: 120 }}
          >
            {c.case_name}
          </div>
        );
      })}
    </div>
  );

  // Start Case button moved to InterviewControls

  // Guest placeholders
  const guestCandidatePlaceholder = <span className="text-gray-400">Waiting for host to select candidate...</span>;
  const guestCasePlaceholder = <span className="text-gray-400">Waiting for host to select case...</span>;

  // console.log('isHost for rendering:', isHost);

  return (
    <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <div className="flex-1 mt-2 max-w-full text-black w-[462px] flex flex-col min-h-0">
          <div className="flex-none">
            <Brief
              title="Please confirm who will be the candidate"
              markdown={null}
              placeholder={''}
              defaultOpen={true}
            >
              {isHost === 'host' ? candidateContent : guestCandidatePlaceholder}
            </Brief>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <Brief
              title="Please select your case"
              markdown={null}
              placeholder={''}
              defaultOpen={true}
            >
              {isHost === 'host' ? caseContent : guestCasePlaceholder}
            </Brief>
          </div>
        </div>
        {/* Start Case button moved to InterviewControls */}
      </div>
    </div>
  );
};

export default PrepPanel; 