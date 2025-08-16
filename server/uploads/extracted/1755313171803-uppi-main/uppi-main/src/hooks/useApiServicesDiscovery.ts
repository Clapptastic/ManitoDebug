import { useCallback, useMemo, useState } from 'react';

/**
 * useApiServicesDiscovery
 * Build-time discovery of system API service files using Vite's glob import.
 * - Detects files under src/services/api/** matching *ApiService.ts
 * - Provides simple metadata for display in admin inventory
 *
 * Note: This reflects repository state automatically on rebuild/HMR, so new
 * services appear without additional wiring.
 */
export interface DiscoveredService {
  filePath: string;
  name: string; // derived from filename
  directory: string; // parent folder relative to src/services/api
}

export function useApiServicesDiscovery() {
  const globResult = import.meta.glob('/src/services/api/**/*ApiService.ts');

  const compute = useCallback((): DiscoveredService[] => {
    return Object.keys(globResult)
      .map((p) => {
        const parts = p.split('/');
        const file = parts[parts.length - 1];
        const name = file.replace('.ts', '');
        // Get directory after 'api'
        const apiIdx = parts.findIndex((seg) => seg === 'api');
        const directory = apiIdx >= 0 ? parts.slice(apiIdx + 1, parts.length - 1).join('/') : '';
        return { filePath: p, name, directory } as DiscoveredService;
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [globResult]);

  const [services, setServices] = useState<DiscoveredService[]>(compute());

  const refresh = useCallback(() => setServices(compute()), [compute]);

  return useMemo(() => ({ services, refresh }), [services, refresh]);
}
