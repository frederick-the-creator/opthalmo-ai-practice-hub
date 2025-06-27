import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { renderMarkdownToReact } from '@/integrations/supabase/utils';

type BriefProps = {
  title: string;
  markdown?: string | null;
  placeholder?: string;
  defaultOpen?: boolean;
  children?: React.ReactNode;
};

const Brief: React.FC<BriefProps> = ({ title, markdown, placeholder, defaultOpen = true, children }) => (
  <Collapsible className="overflow-hidden flex-1 py-2.5 pr-2.5 w-full max-w-[462px] max-md:max-w-full" defaultOpen={defaultOpen}>
    <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium max-md:max-w-full bg-[#0E5473] text-white px-3 py-2 rounded-md" style={{ backgroundColor: '#0E5473' }}>
      <div className="text-base font-medium leading-[24px] flex-1 text-left" style={{ color: 'white' }}>
        {title}
      </div>
      <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
    </CollapsibleTrigger>
    <CollapsibleContent>
      <div className="overflow-hidden flex-1 shrink gap-2.5 mt-2.5 text-xs leading-6 basis-0 size-full max-md:max-w-full p-3 rounded-md">
        {children ? children : (markdown ? renderMarkdownToReact(markdown) : <span>{placeholder}</span>)}
      </div>
    </CollapsibleContent>
  </Collapsible>
);

export default Brief; 