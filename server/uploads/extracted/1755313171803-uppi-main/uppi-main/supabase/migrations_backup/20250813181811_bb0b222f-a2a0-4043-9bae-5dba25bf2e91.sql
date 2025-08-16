-- Create competitor analysis prompts with proper variable interpolation

-- System prompt
INSERT INTO prompts (key, provider, domain, description, is_active) 
VALUES ('competitor_analysis.system.default', 'system', 'competitor_analysis', 'System prompt for competitor analysis', true);

-- OpenAI specific prompt
INSERT INTO prompts (key, provider, domain, description, is_active) 
VALUES ('competitor_analysis.openai.default', 'openai', 'competitor_analysis', 'OpenAI-optimized competitor analysis prompt', true);

-- Anthropic specific prompt
INSERT INTO prompts (key, provider, domain, description, is_active) 
VALUES ('competitor_analysis.anthropic.default', 'anthropic', 'competitor_analysis', 'Anthropic-optimized competitor analysis prompt', true);

-- Perplexity specific prompt
INSERT INTO prompts (key, provider, domain, description, is_active) 
VALUES ('competitor_analysis.perplexity.default', 'perplexity', 'competitor_analysis', 'Perplexity-optimized competitor analysis prompt', true);

-- Gemini specific prompt  
INSERT INTO prompts (key, provider, domain, description, is_active) 
VALUES ('competitor_analysis.gemini.default', 'gemini', 'competitor_analysis', 'Gemini-optimized competitor analysis prompt', true);

-- Create prompt versions with actual content

-- System prompt version
INSERT INTO prompt_versions (prompt_id, version, content, is_active) 
SELECT id, 1, 'You are a meticulous market analyst. Extract and normalize competitor data for exactly the JSON schema provided. Never invent numbers—return null with low confidence if unknown. Include evidence_sources for each nontrivial claim. Output JSON only.', true
FROM prompts WHERE key = 'competitor_analysis.system.default';

-- OpenAI prompt version with variables
INSERT INTO prompt_versions (prompt_id, version, content, is_active)
SELECT id, 1, 'Company: {{company}}
Goal: Produce a complete competitor dossier with 100+ attributes covering product, pricing, GTM, market position, and quality signals.

Instructions:
- Use only reputable, current public sources (official website, docs, pricing page, status page, G2/Trustpilot, press, blogs, social).
- Output strictly a single JSON object matching the schema keys exactly. Do not include commentary.
- For arrays, prefer at least 3 items when available.
- For numeric estimates, include a confidence_scores entry with rationale.
- If a field is unknown, set null and add a confidence_scores entry noting "unknown".
- Evidence: add at least 5 entries in evidence_sources with URLs and concise titles.

Schema to fill:
{{schema}}', true
FROM prompts WHERE key = 'competitor_analysis.openai.default';

-- Anthropic prompt version with variables
INSERT INTO prompt_versions (prompt_id, version, content, is_active)
SELECT id, 1, 'Research target: {{name}}

As an expert competitive intelligence analyst, conduct comprehensive research on {{company}} and return a detailed JSON analysis.

Key Requirements:
- Focus on factual, verifiable information from public sources
- Include confidence scores for estimates and uncertain data
- Populate evidence_sources with actual URLs and publication dates
- Return complete JSON matching the provided schema structure
- Use null for truly unknown fields rather than guessing

Target Schema:
{{schema}}', true
FROM prompts WHERE key = 'competitor_analysis.anthropic.default';

-- Perplexity prompt version with variables (optimized for web search)
INSERT INTO prompt_versions (prompt_id, version, content, is_active)
SELECT id, 1, 'Target Company: {{company}}

Leverage your real-time web search capabilities to analyze {{name}} comprehensively. Focus on recent information and current market position.

Search Strategy:
- Official website and documentation
- Recent news and press releases
- Pricing pages and product information
- Customer reviews on G2, Trustpilot, app stores
- Financial reports and funding announcements
- Social media presence and engagement

Output Requirements:
- Single JSON object following the exact schema
- Include recent, verifiable sources in evidence_sources
- Mark uncertain data with appropriate confidence scores
- Focus on current market position and recent developments

Schema:
{{schema}}', true
FROM prompts WHERE key = 'competitor_analysis.perplexity.default';

-- Gemini prompt version with variables
INSERT INTO prompt_versions (prompt_id, version, content, is_active)
SELECT id, 1, 'Analyze: {{company}}

Conduct thorough competitive intelligence on {{name}} using your knowledge and reasoning capabilities.

Analysis Framework:
1. Company Overview & Market Position
2. Product/Service Portfolio Analysis  
3. Pricing Strategy & Business Model
4. Go-to-Market & Customer Acquisition
5. Financial Performance & Funding
6. Competitive Landscape & Differentiation
7. Technology & Innovation Profile
8. Brand & Market Perception

Requirements:
- Output only valid JSON matching the schema
- Include confidence assessment for each major claim
- Provide source attribution where possible
- Use null for unavailable data points

Expected JSON Schema:
{{schema}}', true
FROM prompts WHERE key = 'competitor_analysis.gemini.default';

-- Update current_version_id for all prompts
UPDATE prompts SET current_version_id = (
  SELECT id FROM prompt_versions pv WHERE pv.prompt_id = prompts.id AND pv.is_active = true LIMIT 1
);