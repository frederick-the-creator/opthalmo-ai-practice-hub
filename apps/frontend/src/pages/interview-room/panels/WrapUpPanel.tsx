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
  const isHost = role === 'host';
  const handleRedo = () => {
    const confirmed = window.confirm(
      'This will overwrite your previous recording and you will not receive feedback on your performance.'
    );
    if (confirmed) {
      onDoAnother();
    }
  };
  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full justify-center">
      {isHost ? (
        <>
          <Button className="mb-4 w-64 text-lg self-center" onClick={() => { onTranscript(); onExit(); }}>Finish</Button>
          <Button className="mb-4 w-64 text-lg self-center" variant="outline" onClick={handleRedo}>Redo</Button>
        </>
      ) : (
        <div className="text-center text-gray-500">
          Waiting for host to wrap up...
        </div>
      )}
    </div>
  );
};

export default WrapUpPanel; 