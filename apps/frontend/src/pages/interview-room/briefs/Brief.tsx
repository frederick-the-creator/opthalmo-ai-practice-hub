import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { renderMarkdownToReact } from '@/supabase/utils';

type BriefProps = {
  title: string;
  markdown?: string | null;
  placeholder?: string;
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  containerClassName?: string;
  contentClassName?: string;
};

const Brief: React.FC<BriefProps> = ({
  title,
  markdown,
  placeholder,
  defaultOpen = true,
  open,
  onOpenChange,
  children,
  containerClassName,
  contentClassName,
}) => (
  <Collapsible
    className={`overflow-hidden flex flex-col min-h-0 py-2.5 pr-2.5 pb-0 w-full max-w-[462px] max-md:max-w-full`} //       ${containerClassName ?? ''}
    defaultOpen={open === undefined ? defaultOpen : undefined}
    open={open}
    onOpenChange={onOpenChange}
  >
    <CollapsibleTrigger className="flex gap-2.5 items-center w-full text-base font-medium max-md:max-w-full bg-primary text-white px-3 py-2 rounded-md">
      <div className="text-base font-medium leading-[24px] flex-1 text-left text-white">
        {title}
      </div>
      <ChevronDown className="h-5 w-5 text-white transition-transform duration-200" />
    </CollapsibleTrigger>
    <CollapsibleContent className="flex-1 min-h-0 flex flex-col">
      <div
        className={`brief-content overflow-y-auto flex-1 min-h-0 gap-2.5 mt-0 text-xs leading-6 max-md:max-w-full p-3 pt-0 rounded-md `} //${contentClassName ?? ''}
      >
        {children ? children : (markdown ? renderMarkdownToReact(markdown) : <span>{placeholder}</span>)}
      </div>
    </CollapsibleContent>
  </Collapsible>
);

export default Brief; 