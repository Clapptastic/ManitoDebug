-- Delete the mock competitor analysis data
DELETE FROM competitor_analyses 
WHERE id = 'e3c7d70c-f9a2-423c-a50f-4f0263d37f66' 
AND user_id = 'b4df2927-56f4-45d1-9749-6cd60f56a808'
AND name = 'replit'
AND data_completeness_score = 24;