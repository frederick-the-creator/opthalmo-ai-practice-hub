import React from 'react';
import { Stage } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';

type HeaderBarProps = {
  stage: Stage;
  role: 'host' | 'guest' | null;
  updating?: boolean;
  onExit: () => void;
  onBack?: () => void;
};

const HeaderBar: React.FC<HeaderBarProps> = ({ stage, role, onExit, onBack }) => {
  return (
    <header className="flex flex-wrap gap-2.5 items-center pb-5 w-full text-xl whitespace-nowrap max-md:max-w-full">
      <Button
        className="font-bold text-white bg-primary hover:bg-primary/90 border-none"
        onClick={onExit}
      >
        Exit
      </Button>
      {/* Show Back only for host and not PREP stage */}
      {role === 'host' && stage !== Stage.PREP && onBack && (
        <Button
          className="font-bold text-white bg-primary hover:bg-primary/90 border-none"
          onClick={onBack}
        >
          Back
        </Button>
      )}
    </header>
  );
};

export default HeaderBar; 