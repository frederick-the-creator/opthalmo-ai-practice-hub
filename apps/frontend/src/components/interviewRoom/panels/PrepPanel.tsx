import React from 'react';
import Brief from './PanelBriefs';

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

  const [selectedType, setSelectedType] = React.useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = React.useState<string | null>(null);
  const [highlightMode, setHighlightMode] = React.useState<'random' | 'specific' | null>(null);
  const [localSelectedCaseId, setLocalSelectedCaseId] = React.useState<string | null>(null);
  
  const distinctTypes: string[] = React.useMemo(() => {
    const types = new Set<string>();
    cases.forEach(c => { if (c?.type) types.add(c.type); });
    return Array.from(types).sort();
  }, [cases]);

  const distinctCategories: string[] = React.useMemo(() => {
    const categories = new Set<string>();
    const base = selectedType ? cases.filter(c => c?.type === selectedType) : cases;
    base.forEach(c => { if (c?.category) categories.add(c.category); });
    return Array.from(categories).sort();
  }, [cases, selectedType]);

  React.useEffect(() => {
    if (selectedCategory && !distinctCategories.includes(selectedCategory)) {
      setSelectedCategory(null);
    }
  }, [distinctCategories, selectedCategory]);

  const filteredCases = React.useMemo(() => {
    let result = cases;
    if (selectedType) {
      result = result.filter(c => c?.type === selectedType);
    }
    if (selectedCategory) {
      result = result.filter(c => c?.category === selectedCategory);
    }
    return result;
  }, [cases, selectedType, selectedCategory]);

  const filterContent = (
    <div className="flex flex-col">
      {distinctTypes.map(t => (
        <div
          key={t}
          onClick={() => setSelectedType(prev => prev === t ? null : t)}
          className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
            ${selectedType === t
              ? 'bg-primary-foreground text-black'
              : 'bg-transparent text-black hover:bg-gray-100'}
          `}
          style={{ minWidth: 120 }}
        >
          {t}
        </div>
      ))}
      {distinctTypes.length === 0 && (
        <span className="text-gray-400">No types available</span>
      )}
    </div>
  );

  const categoryContent = (
    <div className="flex flex-col">
      {distinctCategories.map(cat => (
        <div
          key={cat}
          onClick={() => setSelectedCategory(prev => prev === cat ? null : cat)}
          className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
            ${selectedCategory === cat
              ? 'bg-primary-foreground text-black'
              : 'bg-transparent text-black hover:bg-gray-100'}
          `}
          style={{ minWidth: 120 }}
        >
          {cat}
        </div>
      ))}
      {distinctCategories.length === 0 && (
        <span className="text-gray-400">No categories available</span>
      )}
    </div>
  );

  const caseContent = (
    <div className="flex flex-col">
      {filteredCases.length > 0 && (
        <div
          key="random-case"
          onClick={() => {
            const randomIndex = Math.floor(Math.random() * filteredCases.length);
            const randomCase = filteredCases[randomIndex];
            onSelectCase(round.id, randomCase.id);
            setHighlightMode('random');
            setLocalSelectedCaseId(null);
          }}
          className={`cursor-pointer px-4 py-2 text-base font-bold text-left transition
            ${highlightMode === 'random'
              ? 'bg-primary-foreground text-black'
              : 'bg-transparent text-black hover:bg-gray-100'}
          `}
          style={{ minWidth: 120 }}
        >
          Random Case
        </div>
      )}
      {filteredCases.map(c => {
        return (
          <div
            key={c.id}
            onClick={() => {
              setHighlightMode('specific');
              setLocalSelectedCaseId(c.id);
              onSelectCase(round.id, c.id);
            }}
            className={`cursor-pointer px-4 py-2 text-base font-medium text-left transition
              ${highlightMode === 'random'
                ? 'bg-transparent text-black hover:bg-gray-100'
                : (highlightMode === 'specific'
                    ? (localSelectedCaseId === c.id
                        ? 'bg-primary-foreground text-black'
                        : 'bg-transparent text-black hover:bg-gray-100')
                    : (round?.case_brief_id === c.id
                        ? 'bg-primary-foreground text-black'
                        : 'bg-transparent text-black hover:bg-gray-100'))}
            `}
            style={{ minWidth: 120 }}
          >
            {c.case_name}
          </div>
        );
      })}
      {filteredCases.length === 0 && (
        <span className="text-gray-400">No cases match this filter</span>
      )}
    </div>
  );

  // Start Case button moved to InterviewControls

  // Guest placeholders
  const guestCandidatePlaceholder = <span className="text-gray-400">Waiting for host to select candidate...</span>;
  const guestCasePlaceholder = <span className="text-gray-400">Waiting for host to select case...</span>;
  const guestCategoryPlaceholder = <span className="text-gray-400">Waiting for host to select category filter...</span>;

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
          <div className="flex-none mt-2">
            <Brief
              title="Filter available cases"
              markdown={null}
              placeholder={''}
              defaultOpen={true}
            >
              {isHost === 'host' ? filterContent : <span className="text-gray-400">Waiting for host to select filter...</span>}
            </Brief>
        </div>
          <div className="flex-none mt-2">
            <Brief
              title="Filter by category"
              markdown={null}
              placeholder={''}
              defaultOpen={true}
            >
              {isHost === 'host' ? categoryContent : guestCategoryPlaceholder}
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