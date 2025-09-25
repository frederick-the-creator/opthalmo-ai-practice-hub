import React from 'react';
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

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

/**
 * Converts a markdown string to React elements for safe rendering in the UI.
 * Can be used for candidate_brief, actor_brief, markscheme, etc.
 * @param markdown - The markdown string to render
 * @returns React element rendering the markdown
 */
function renderMarkdownToReact(markdown: string | undefined | null): React.ReactNode {

  if (!markdown) return null;
  // 1. Replace all literal \n with real newlines


  // Debug: log the normalized string

  return <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{markdown}</ReactMarkdown>;
}


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