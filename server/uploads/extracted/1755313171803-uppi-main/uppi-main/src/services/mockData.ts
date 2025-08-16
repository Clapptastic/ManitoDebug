
export interface StartupIdea {
  id: string;
  title: string;
  description: string;
  status: 'validation' | 'mvp' | 'growth';
}

// DEPRECATED: Mock data service - use real Supabase data instead
export const mockDataService = {
  getIdeas: async () => {
    console.warn('Mock data service is deprecated. Use real Supabase data instead.');
    return [];
  },
  
  addIdea: async (idea: Omit<StartupIdea, 'id'>) => {
    console.warn('Mock data service is deprecated. Use real Supabase data instead.');
    return null;
  },
  
  updateIdea: async (id: string, updates: Partial<StartupIdea>) => {
    console.warn('Mock data service is deprecated. Use real Supabase data instead.');
    return null;
  },
  
  deleteIdea: async (id: string) => {
    console.warn('Mock data service is deprecated. Use real Supabase data instead.');
  }
};
