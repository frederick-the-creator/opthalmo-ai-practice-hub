import React from 'react';
import { Button } from '@/components/ui/button';

type HeaderBarProps = {
  stage: string;
  isHost: 'host' | 'guest' | null;
  updating?: boolean;
  onExit: () => void;
  onBack?: () => void;
};

const HeaderBar: React.FC<HeaderBarProps> = ({ stage, isHost, onExit, onBack }) => {
  return (
    <header className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
      <Button
        className="font-bold text-white bg-primary hover:bg-accent border-none"
        onClick={onExit}
      >
        Exit
      </Button>
      {/* Show Back only for host and not PREP or WRAP_UP stage */}
      {isHost === 'host' && stage !== "Prep" && stage !== "WrapUp" && onBack && (
        <Button
          className="font-bold text-white bg-primary hover:bg-accent border-none"
          onClick={onBack}
        >
          Back
        </Button>
      )}
    </header>
  );
};

export default HeaderBar; 