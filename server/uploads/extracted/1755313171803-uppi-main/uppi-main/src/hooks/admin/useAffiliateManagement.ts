import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AffiliateProgram {
  id: string;
  program_name: string;
  affiliate_code: string;
  commission_rate: number;
  status: string;
  created_at: string;
  updated_at: string;
  // Extended fields for provider-specific links
  provider?: string;
  default_url?: string | null;
  affiliate_url?: string | null;
  is_active?: boolean;
  domain?: string | null;
}

export const useAffiliateManagement = () => {
  const [affiliatePrograms, setAffiliatePrograms] = useState<AffiliateProgram[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const fetchAffiliatePrograms = async () => {
  try {
    setIsLoading(true);
    setError(null);

    // Fetch active affiliate programs (anyone can view)
    const { data, error: fetchError } = await supabase
      .from('affiliate_programs')
      .select('id, program_name, provider, affiliate_code, commission_rate, status, created_at, updated_at, default_url, affiliate_url, is_active, domain')
      .order('program_name', { ascending: true });

    if (fetchError) throw fetchError;

    setAffiliatePrograms((data || []) as AffiliateProgram[]);
  } catch (err) {
    console.error('Error fetching affiliate programs:', err);
    setError(err instanceof Error ? err.message : 'Unknown error');
  } finally {
    setIsLoading(false);
  }
};

const addAffiliateProgram = async (program: Omit<AffiliateProgram, 'id' | 'created_at' | 'updated_at'>) => {
  try {
    const { data, error: insertError } = await supabase
      .from('affiliate_programs')
      .insert({
        program_name: program.program_name,
        provider: program.provider ?? null,
        affiliate_code: program.affiliate_code,
        commission_rate: program.commission_rate,
        status: program.status,
        default_url: program.default_url ?? null,
        affiliate_url: program.affiliate_url ?? null,
        is_active: program.is_active ?? true,
        domain: program.domain ?? null,
      })
      .select('*')
      .maybeSingle();

    if (insertError) throw insertError;

    await fetchAffiliatePrograms();
    return data as AffiliateProgram;
  } catch (err) {
    console.error('Error adding affiliate program:', err);
    throw err;
  }
};

const updateAffiliateProgram = async (id: string, updates: Partial<AffiliateProgram>) => {
  try {
    const { error: updateError } = await supabase
      .from('affiliate_programs')
      .update({
        program_name: updates.program_name,
        provider: updates.provider,
        affiliate_code: updates.affiliate_code,
        commission_rate: updates.commission_rate,
        status: updates.status,
        default_url: updates.default_url,
        affiliate_url: updates.affiliate_url,
        is_active: updates.is_active,
        domain: updates.domain,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    await fetchAffiliatePrograms();
    return null;
  } catch (err) {
    console.error('Error updating affiliate program:', err);
    throw err;
  }
};

const deleteAffiliateProgram = async (id: string) => {
  try {
    const { error: deleteError } = await supabase
      .from('affiliate_programs')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    await fetchAffiliatePrograms();
  } catch (err) {
    console.error('Error deleting affiliate program:', err);
    throw err;
  }
};

  useEffect(() => {
    fetchAffiliatePrograms();
  }, []);

  return {
    affiliatePrograms,
    isLoading,
    error,
    addAffiliateProgram,
    updateAffiliateProgram,
    deleteAffiliateProgram,
    refetch: fetchAffiliatePrograms
  };
};