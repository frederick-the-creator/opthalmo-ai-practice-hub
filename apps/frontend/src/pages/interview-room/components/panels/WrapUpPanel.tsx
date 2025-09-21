import React from 'react';
import { Button } from '@/components/ui/button';

type WrapUpPanelProps = {
  isHost: 'host' | 'guest' | null;
  updating?: boolean;
  onExit: () => void;
  onNextRound: () => void;
};

const WrapUpPanel: React.FC<WrapUpPanelProps> = ({ isHost, onExit, onNextRound }) => {
  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full justify-center">
      {isHost === 'host' ? (
        <>
          <Button className="mb-4 w-64 text-lg self-center" onClick={() => { onNextRound() }}>Next Round</Button>
          <Button className="mb-4 w-64 text-lg self-center" variant="outline" onClick={() => { onExit() }}>Finish</Button>
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