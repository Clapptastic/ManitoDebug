
import { createContext, useContext, useState, ReactNode } from 'react';

interface ApiContextType {
  enabledApis: string[];
  toggleApi: (api: string, enabled: boolean) => void;
  isApiEnabled: (api: string) => boolean;
}

const ApiContext = createContext<ApiContextType | undefined>(undefined);

export function ApiProvider({ children }: { children: ReactNode }) {
  const [enabledApis, setEnabledApis] = useState<string[]>(['perplexity']);

  const toggleApi = (api: string, enabled: boolean) => {
    setEnabledApis(prev => 
      enabled 
        ? [...prev, api]
        : prev.filter(a => a !== api)
    );
  };

  const isApiEnabled = (api: string) => enabledApis.includes(api);

  return (
    <ApiContext.Provider value={{ enabledApis, toggleApi, isApiEnabled }}>
      {children}
    </ApiContext.Provider>
  );
}

export function useApi() {
  const context = useContext(ApiContext);
  if (context === undefined) {
    throw new Error('useApi must be used within an ApiProvider');
  }
  return context;
}
