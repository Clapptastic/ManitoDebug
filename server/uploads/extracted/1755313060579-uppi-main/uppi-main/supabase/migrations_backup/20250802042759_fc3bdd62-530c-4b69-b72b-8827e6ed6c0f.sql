-- Update old pending analyses to failed status
UPDATE competitor_analyses 
SET status = 'failed', 
    updated_at = now() 
WHERE status = 'pending' 
AND created_at < now() - interval '10 minutes';