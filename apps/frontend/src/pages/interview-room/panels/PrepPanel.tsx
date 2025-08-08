import React from 'react';
import Brief from '../briefs/Brief';

type PrepPanelProps = {
  session: any;
  cases: any[];
  role: 'host' | 'guest' | null;
  updating?: boolean;
  onSelectCandidate: (id: string) => void;
  onSelectCase: (id: string) => void;
};

const PrepPanel: React.FC<PrepPanelProps> = ({ session, cases, role, updating, onSelectCandidate, onSelectCase }) => {

  // Candidate selection content
  const candidates = [
    session?.host_id
      ? {
          id: session.host_id,
          name:
            session.host_profile && (session.host_profile.first_name || session.host_profile.last_name)
              ? `${session.host_profile.first_name || ''} ${session.host_profile.last_name || ''}`.trim() || 'Host'
              : 'Host',
        }
      : null,
    session?.guest_id
      ? {
          id: session.guest_id,
          name:
            session.guest_profile && (session.guest_profile.first_name || session.guest_profile.last_name)
              ? `${session.guest_profile.first_name || ''} ${session.guest_profile.last_name || ''}`.trim() || 'Guest'
              : 'Guest',
        }
      : null,
  ].filter(Boolean);

  const candidateContent = (
    <div className="flex flex-col">
      {candidates.map(user => {
        return (
          <div
            key={user.id}
            onClick={() => onSelectCandidate(user.id)}
            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
              ${session?.candidate_id === user.id
                ? 'bg-primary-foreground text-primary'
                : 'bg-transparent text-primary hover:bg-gray-100'}
            `}
            style={{ minWidth: 120 }}
          >
            {user.name}
          </div>
        );
      })}
    </div>
  );

  // Case selection content
  const caseContent = (
    <div className="flex flex-col">
      {cases.map(c => {
        // console.log('case:', c);
        return (
          <div
            key={c.id}
            onClick={() => onSelectCase(c.id)}
            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
              ${session?.case_id === c.id
                ? 'bg-primary-foreground text-primary'
                : 'bg-transparent text-primary hover:bg-gray-100'}
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

  // console.log('role for rendering:', role);

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
              {role === 'host' ? candidateContent : guestCandidatePlaceholder}
            </Brief>
          </div>
          <div className="flex-1 min-h-0 flex flex-col">
            <Brief
              title="Please select your case"
              markdown={null}
              placeholder={''}
              defaultOpen={true}
            >
              {role === 'host' ? caseContent : guestCasePlaceholder}
            </Brief>
          </div>
        </div>
        {/* Start Case button moved to InterviewControls */}
      </div>
    </div>
  );
};

export default PrepPanel; 