import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    console.log('Starting master profile population...');

    // Get unique competitor analyses grouped by company name
    const { data: analyses, error: analysesError } = await supabaseClient
      .from('competitor_analyses')
      .select('*')
      .not('name', 'is', null)
      .neq('name', '');

    if (analysesError) {
      throw analysesError;
    }

    console.log(`Found ${analyses?.length || 0} competitor analyses`);

    // Group by normalized company name
    const companyGroups = new Map();
    
    analyses?.forEach(analysis => {
      const normalizedName = analysis.name.toLowerCase().trim().replace(/[^\w\s]/g, '').replace(/\s+/g, ' ');
      
      if (!companyGroups.has(normalizedName)) {
        companyGroups.set(normalizedName, {
          name: analysis.name,
          normalized_name: normalizedName,
          analyses: [analysis],
          latest_analysis: analysis.created_at
        });
      } else {
        const group = companyGroups.get(normalizedName);
        group.analyses.push(analysis);
        if (analysis.created_at > group.latest_analysis) {
          group.latest_analysis = analysis.created_at;
          // Update with latest data
          group.name = analysis.name;
        }
      }
    });

    console.log(`Grouped into ${companyGroups.size} unique companies`);

    let profilesCreated = 0;
    let profilesUpdated = 0;

    // Process each company group
    for (const [normalizedName, group] of companyGroups) {
      try {
        // Check if master profile already exists
        const { data: existingProfile, error: checkError } = await supabaseClient
          .from('master_company_profiles')
          .select('id')
          .eq('normalized_name', normalizedName)
          .maybeSingle();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error(`Error checking existing profile for ${group.name}:`, checkError);
          continue;
        }

        // Get the best data from all analyses
        const bestAnalysis = group.analyses
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];

        const profileData = {
          company_name: group.name,
          normalized_name: normalizedName,
          industry: bestAnalysis.industry,
          primary_domain: bestAnalysis.website_url ? 
            bestAnalysis.website_url.replace(/https?:\/\//, '').replace(/\/$/, '') : null,
          employee_count: bestAnalysis.employee_count,
          revenue_estimate: bestAnalysis.revenue_estimate,
          headquarters: bestAnalysis.headquarters,
          description: bestAnalysis.description ? bestAnalysis.description.substring(0, 500) : null,
          founded_year: bestAnalysis.founded_year,
          source_analyses: group.analyses.map(a => a.id),
          data_completeness_score: Math.min(85, 50 + (group.analyses.length * 10)),
          overall_confidence_score: Math.min(95, 60 + (group.analyses.length * 8)),
          validation_status: 'pending',
          created_by: '00000000-0000-0000-0000-000000000000',
          last_updated_by: '00000000-0000-0000-0000-000000000000'
        };

        if (existingProfile) {
          // Update existing profile
          const { error: updateError } = await supabaseClient
            .from('master_company_profiles')
            .update({
              ...profileData,
              updated_at: new Date().toISOString()
            })
            .eq('id', existingProfile.id);

          if (updateError) {
            console.error(`Error updating profile for ${group.name}:`, updateError);
          } else {
            profilesUpdated++;
            console.log(`Updated profile for ${group.name}`);
          }
        } else {
          // Create new profile
          const { error: insertError } = await supabaseClient
            .from('master_company_profiles')
            .insert(profileData);

          if (insertError) {
            console.error(`Error creating profile for ${group.name}:`, insertError);
          } else {
            profilesCreated++;
            console.log(`Created profile for ${group.name}`);
          }
        }
      } catch (error) {
        console.error(`Error processing ${group.name}:`, error);
      }
    }

    console.log(`Population complete: ${profilesCreated} created, ${profilesUpdated} updated`);

    return new Response(
      JSON.stringify({
        success: true,
        profilesCreated,
        profilesUpdated,
        totalCompanies: companyGroups.size
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in populate-master-profiles function:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});