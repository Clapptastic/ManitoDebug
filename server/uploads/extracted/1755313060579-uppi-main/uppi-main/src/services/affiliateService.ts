import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface AffiliateLink {
  id: string;
  name: string;
  url: string;
  affiliate_code: string;
  clicks: number;
  conversions: number;
  status: 'active' | 'inactive' | 'pending';
  category: string;
  program_name: string;
  revenue: number;
  created_at: string;
  updated_at: string;
}

class AffiliateService {
  async getAffiliateLinks(): Promise<AffiliateLink[]> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data || []).map(link => ({
        ...link,
        status: link.status as 'active' | 'inactive' | 'pending',
        category: 'general',
        revenue: 0,
        program_name: 'Default Program'
      }));
    } catch (error) {
      console.error('Error fetching affiliate links:', error);
      return [];
    }
  }

  async createAffiliateLink(linkData: Omit<AffiliateLink, 'id' | 'clicks' | 'conversions' | 'created_at' | 'updated_at'>): Promise<AffiliateLink> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .insert(linkData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Affiliate link created successfully',
      });

      return {
        ...data,
        status: data.status as 'active' | 'inactive' | 'pending',
        category: 'general',
        revenue: 0,
        program_name: 'Default Program'
      };
    } catch (error) {
      console.error('Error creating affiliate link:', error);
      throw error;
    }
  }

  async updateAffiliateLink(id: string, updates: Partial<AffiliateLink>): Promise<AffiliateLink> {
    try {
      const { data, error } = await supabase
        .from('affiliate_links')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Affiliate link updated successfully',
      });

      return {
        ...data,
        status: data.status as 'active' | 'inactive' | 'pending',
        category: 'general',
        revenue: 0,
        program_name: 'Default Program'
      };
    } catch (error) {
      console.error('Error updating affiliate link:', error);
      throw error;
    }
  }

  async deleteAffiliateLink(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('affiliate_links')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Affiliate link deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting affiliate link:', error);
      throw error;
    }
  }

  async getPerformanceStats(): Promise<any> {
    try {
      const links = await this.getAffiliateLinks();
      const totalClicks = links.reduce((sum, link) => sum + link.clicks, 0);
      const totalConversions = links.reduce((sum, link) => sum + link.conversions, 0);
      
      return {
        totalClicks,
        totalConversions,
        conversionRate: totalClicks > 0 ? (totalConversions / totalClicks) * 100 : 0,
        topPerformingLinks: links.slice(0, 5)
      };
    } catch (error) {
      console.error('Error fetching performance stats:', error);
      return { totalClicks: 0, totalConversions: 0, conversionRate: 0, topPerformingLinks: [] };
    }
  }
}

export const affiliateService = new AffiliateService();