import React from 'react';
import { Button } from '@/components/ui/button';

type WrapUpPanelProps = {
  role: 'host' | 'guest' | null;
  updating?: boolean;
  onExit: () => void;
  onDoAnother: () => void;
  onTranscript: () => void;
};

const WrapUpPanel: React.FC<WrapUpPanelProps> = ({ role, onExit, onDoAnother, onTranscript }) => {
  if (role !== 'host') return null;
  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full justify-center">
      <Button className="mb-4 w-64 text-lg self-center" onClick={onExit}>Finish</Button>
      <Button className="mb-4 w-64 text-lg self-center" variant="outline" onClick={onDoAnother}>Do Another Case</Button>
      <Button className="w-64 text-lg self-center" variant="secondary" onClick={onTranscript}>Transcript Review</Button>
    </div>
  );
};

export default WrapUpPanel; 