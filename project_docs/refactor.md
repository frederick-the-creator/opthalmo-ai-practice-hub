# Updated implementation plan  
*(Polling loop already removed. Focus on error handling, optional React-Query, styling, and accessibility.)*

---

## 3  Data-layer improvements 🌐

### 3-A  Verify existing realtime subscription
1. Confirm `useInterviewSession` establishes exactly one `supabase.channel(...).on('postgres_changes')` per `sessionId`.
2. Ensure proper cleanup with `channel.unsubscribe()` in the hook’s `useEffect` return.

### 3-B  Robust error handling
1. Wrap every Supabase call (`updateStage`, `setCase`, etc.) in `try/catch`.  
2. Store the message in the hook’s `error` state.  
3. Surface an **alert component** in the UI that shows the message and offers a **Retry** button linked to the failed operation.

### 3-C  Optional: adopt TanStack Query
1. Install: `pnpm add @tanstack/react-query`.  
2. Wrap the app with `<QueryClientProvider>`.  
3. Replace ad-hoc fetches with `useQuery` for caching and retries.  
4. On realtime payload, synchronise by calling `queryClient.setQueryData(['session', sessionId], payload.new)`.

---

## 4  Styling & design tokens 🎨

1. **Tailwind config** – add brand colours (`primary`, `primaryFg`, etc.) under `theme.extend.colors`.  
2. Search & replace inline hex (`#0E5473`, `#E5EEF3`) and inline `style={{…}}` blocks with Tailwind utility classes (`bg-primary`, `text-primary`, `bg-primaryFg`, …).  
3. Implement a consistent disabled style via a `btn-disabled` class; ensure buttons set `aria-disabled={true}` when inactive.  
4. *(Nice-to-have)* Add simple `framer-motion` animations for panel entry/exit.

---

## 5  Accessibility ♿

* Add `aria-expanded` and `aria-controls` to all collapsible triggers.  
* Set iframe `title` dynamically based on stage and role (e.g., “Interview – Candidate View”).  
* Run a WCAG contrast audit after applying the new colour tokens and adjust if any text fails AA.
