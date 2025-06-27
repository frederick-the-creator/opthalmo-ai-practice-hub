import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';
import Brief from '../briefs/Brief';

type PrepPanelProps = {
  session: any;
  cases: any[];
  role: 'host' | 'guest' | null;
  onSelectCandidate: (id: string) => void;
  onSelectCase: (id: string) => void;
  onStartCase: () => Promise<void> | void;
};

const PrepPanel: React.FC<PrepPanelProps> = ({ session, cases, role, onSelectCandidate, onSelectCase, onStartCase }) => {
  const [loading, setLoading] = useState(false);
  if (role !== 'host') return null;

  // Candidate selection content
  const candidateContent = (
    <div className="flex flex-col">
      {[{id: session?.hostId, name: session?.hostName}, {id: session?.guestId, name: session?.guestName}].map(user => (
        <div
          key={user.id}
          onClick={() => onSelectCandidate(user.id)}
          className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
            ${session?.candidateId === user.id
              ? 'bg-primary-foreground text-primary'
              : 'bg-transparent text-primary hover:bg-gray-100'}
          `}
          style={{ minWidth: 120 }}
        >
          {user.name}
        </div>
      ))}
    </div>
  );

  // Case selection content
  const caseContent = (
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
          onClick={() => onSelectCase(c.id)}
          className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
            ${session?.caseId === c.id
              ? 'bg-primary-foreground text-primary'
              : 'bg-transparent text-primary hover:bg-gray-100'}
          `}
          style={{ minWidth: 120 }}
        >
          {c.case_name}
        </div>
      ))}
    </div>
  );

  const handleStart = async () => {
    setLoading(true);
    try {
      await onStartCase();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ml-5 w-[462px] flex-shrink-0 max-md:ml-0 max-md:w-full">
      <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full">
        <Brief
          title="Please confirm who will be the candidate"
          markdown={null}
          placeholder={''}
          defaultOpen={true}
        >
          {candidateContent}
        </Brief>
        <Brief
          title="Please select your case"
          markdown={null}
          placeholder={''}
          defaultOpen={true}
        >
          {caseContent}
        </Brief>
        <div className="flex justify-center mt-8">
          <Button
            className={`flex items-center gap-2 text-lg px-6 py-3 ${loading ? 'btn-disabled' : ''}`}
            onClick={handleStart}
            disabled={!session?.candidateId || !session?.caseId || loading}
            aria-disabled={loading}
          >
            <Play className="w-5 h-5 mr-2" /> {loading ? "Starting..." : "Start Case"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default PrepPanel; 