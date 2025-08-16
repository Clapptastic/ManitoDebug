import { useCallback, useMemo, useState } from 'react';

/**
 * useEdgeFunctionsList
 * Lightweight build-time discovery of Supabase Edge Functions using Vite's glob import.
 * - Dynamically reflects any new functions added under supabase/functions/[function]/index.ts
 * - No runtime server calls; purely compile-time file discovery for safety and speed
 *
 * Returns the discovered function names (folder names) and a refresh method
 * to re-evaluate during HMR/dev.
 */
export function useEdgeFunctionsList() {
  // import.meta.glob returns a record of matched file paths -> loader functions
  // We only need the keys (file paths) to infer function names
  const globResult = import.meta.glob('/supabase/functions/*/index.ts');

  const deriveNames = useCallback(() => {
    return Object.keys(globResult)
      .map((p) => {
        // Example: '/supabase/functions/ai-validation-engine/index.ts' -> 'ai-validation-engine'
        const parts = p.split('/');
        const idx = parts.findIndex((seg) => seg === 'functions');
        return idx >= 0 && parts[idx + 1] ? parts[idx + 1] : p;
      })
      .sort();
  }, [globResult]);

  const [functions, setFunctions] = useState<string[]>(deriveNames());

  const refresh = useCallback(() => {
    // Re-evaluate the names; useful during dev/HMR
    setFunctions(deriveNames());
  }, [deriveNames]);

  return useMemo(() => ({ functions, refresh }), [functions, refresh]);
}
