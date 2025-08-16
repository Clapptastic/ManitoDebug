-- Fix the function to handle UUID properly
CREATE OR REPLACE FUNCTION populate_master_profiles_from_analyses()
RETURNS TABLE(profiles_created INTEGER, profiles_updated INTEGER) AS $$
DECLARE
  analysis_record RECORD;
  master_profile_id UUID;
  profiles_created_count INTEGER := 0;
  profiles_updated_count INTEGER := 0;
  normalized_company_name TEXT;
BEGIN
  -- Loop through unique companies from competitor analyses
  FOR analysis_record IN 
    SELECT 
      name,
      (ARRAY_AGG(id ORDER BY created_at ASC))[1] as first_analysis_id,
      COUNT(*) as analysis_count,
      MAX(created_at) as latest_analysis,
      STRING_AGG(DISTINCT industry, ', ') as industries,
      STRING_AGG(DISTINCT website_url, ', ') as websites,
      AVG(COALESCE(employee_count, 0)) as avg_employees,
      AVG(COALESCE(revenue_estimate, 0)) as avg_revenue,
      STRING_AGG(DISTINCT headquarters, ', ') as headquarters_list,
      STRING_AGG(DISTINCT description, ' | ') as descriptions,
      MIN(founded_year) as founded_year
    FROM competitor_analyses 
    WHERE name IS NOT NULL AND name != '' 
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) >= 1
  LOOP
    -- Normalize company name
    normalized_company_name := normalize_company_name(analysis_record.name);
    
    -- Check if master profile already exists
    SELECT id INTO master_profile_id
    FROM master_company_profiles
    WHERE normalized_name = normalized_company_name;
    
    IF master_profile_id IS NULL THEN
      -- Create new master profile
      INSERT INTO master_company_profiles (
        company_name,
        normalized_name,
        industry,
        primary_domain,
        employee_count,
        revenue_estimate,
        headquarters,
        description,
        founded_year,
        source_analyses,
        data_completeness_score,
        overall_confidence_score,
        validation_status,
        created_by,
        last_updated_by
      ) VALUES (
        analysis_record.name,
        normalized_company_name,
        SPLIT_PART(analysis_record.industries, ',', 1),
        CASE 
          WHEN analysis_record.websites IS NOT NULL 
          THEN REPLACE(REPLACE(SPLIT_PART(analysis_record.websites, ',', 1), 'https://', ''), 'http://', '')
          ELSE NULL 
        END,
        CASE WHEN analysis_record.avg_employees > 0 THEN analysis_record.avg_employees::INTEGER ELSE NULL END,
        CASE WHEN analysis_record.avg_revenue > 0 THEN analysis_record.avg_revenue ELSE NULL END,
        SPLIT_PART(analysis_record.headquarters_list, ',', 1),
        LEFT(analysis_record.descriptions, 500),
        analysis_record.founded_year,
        ARRAY[analysis_record.first_analysis_id::TEXT],
        CASE 
          WHEN analysis_record.analysis_count >= 3 THEN 85
          WHEN analysis_record.analysis_count >= 2 THEN 75
          ELSE 65
        END,
        CASE 
          WHEN analysis_record.analysis_count >= 3 THEN 90
          WHEN analysis_record.analysis_count >= 2 THEN 80
          ELSE 70
        END,
        'pending',
        '00000000-0000-0000-0000-000000000000'::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
      )
      RETURNING id INTO master_profile_id;
      
      profiles_created_count := profiles_created_count + 1;
    ELSE
      -- Update existing master profile with additional analysis
      UPDATE master_company_profiles SET
        source_analyses = COALESCE(source_analyses, '{}') || ARRAY[analysis_record.first_analysis_id::TEXT],
        data_completeness_score = CASE 
          WHEN analysis_record.analysis_count >= 3 THEN 85
          WHEN analysis_record.analysis_count >= 2 THEN 75
          ELSE 65
        END,
        overall_confidence_score = CASE 
          WHEN analysis_record.analysis_count >= 3 THEN 90
          WHEN analysis_record.analysis_count >= 2 THEN 80
          ELSE 70
        END,
        updated_at = now()
      WHERE id = master_profile_id;
      
      profiles_updated_count := profiles_updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT profiles_created_count, profiles_updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;