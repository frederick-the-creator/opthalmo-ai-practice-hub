import React from 'react';
import { Button } from '@/components/ui/button';

type WrapUpPanelProps = {
  isHost: boolean;
  onAnotherRound: () => void;
  onFinishRoom: () => void;
};

const WrapUpPanel: React.FC<WrapUpPanelProps> = ({ isHost, onFinishRoom, onAnotherRound}) => {
  return (
    <div className="flex flex-col h-[calc(100vh-14rem)] max-md:mt-10 max-md:max-w-full justify-center">
      {isHost ? (
        <>
          <Button className="mb-4 w-64 text-lg self-center" onClick={() => { onAnotherRound() }}>Another Round</Button>
          <Button className="mb-4 w-64 text-lg self-center" variant="outline" onClick={() => { onFinishRoom() }}>Finish</Button>
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