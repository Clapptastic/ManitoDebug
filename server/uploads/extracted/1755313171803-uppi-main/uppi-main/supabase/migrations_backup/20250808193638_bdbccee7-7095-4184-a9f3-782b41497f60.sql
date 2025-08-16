-- Ensure search_path is set for trigger functions (security best practice)
CREATE OR REPLACE FUNCTION public.update_user_provider_costs_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$function$;