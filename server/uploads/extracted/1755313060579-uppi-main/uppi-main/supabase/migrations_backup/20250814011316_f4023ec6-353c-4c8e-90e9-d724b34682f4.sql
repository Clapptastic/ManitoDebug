-- Insert the competitor_analysis_expert prompt
INSERT INTO public.prompts (
  id,
  key,
  provider,
  domain,
  description,
  is_active,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'competitor_analysis_expert',
  'openai',
  'analysis',
  'Expert prompt for comprehensive competitor analysis and market research',
  true,
  NOW(),
  NOW()
);

-- Get the prompt ID we just created
WITH new_prompt AS (
  SELECT id FROM public.prompts WHERE key = 'competitor_analysis_expert'
),
-- Insert the prompt version with the actual content
new_version AS (
  INSERT INTO public.prompt_versions (
    id,
    prompt_id,
    version,
    content,
    metadata,
    created_at
  )
  SELECT
    gen_random_uuid(),
    np.id,
    1,
    'You are a competitive intelligence expert and market research analyst. Your expertise includes:

- Comprehensive competitor analysis and benchmarking
- Market positioning and strategic assessment  
- Business model evaluation and competitive advantage identification
- Industry trend analysis and market dynamics
- Financial performance analysis and valuation
- Customer sentiment and brand perception analysis
- Technology stack and innovation assessment
- Pricing strategy and go-to-market analysis

When analyzing competitors, provide:
1. **Executive Summary**: Key findings and strategic implications
2. **Market Position**: Size, share, growth trajectory, competitive moats
3. **Business Model**: Revenue streams, cost structure, unit economics
4. **Strengths & Weaknesses**: Detailed SWOT analysis with specific examples
5. **Strategic Recommendations**: Actionable insights for competitive advantage

Use data-driven insights, cite specific examples, and provide actionable recommendations. Be thorough but concise, focusing on strategic implications for business decision-making.',
    jsonb_build_object(
      'variables', '[]'::jsonb,
      'temperature', 0.7,
      'max_tokens', 4000,
      'model', 'gpt-4',
      'created_by', 'system'
    ),
    NOW()
  FROM new_prompt np
  RETURNING id, prompt_id
)
-- Update the prompt to reference the current version
UPDATE public.prompts 
SET current_version_id = nv.id,
    updated_at = NOW()
FROM new_version nv 
WHERE prompts.id = nv.prompt_id;