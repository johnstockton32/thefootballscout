-- Update get_comparison_limit to remove agency tier
CREATE OR REPLACE FUNCTION public.get_comparison_limit(_user_id uuid)
 RETURNS integer
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE public.get_subscription_tier(_user_id)
    WHEN 'free' THEN 2
    WHEN 'pro' THEN 5
    WHEN 'team' THEN 10
    ELSE 2
  END
$function$;

-- Update can_create_player to remove agency tier
CREATE OR REPLACE FUNCTION public.can_create_player(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.get_subscription_tier(_user_id) IN ('pro', 'team') THEN true
    WHEN public.get_player_count(_user_id) < 10 THEN true
    ELSE false
  END
$function$;

-- Update can_create_report to remove agency tier
CREATE OR REPLACE FUNCTION public.can_create_report(_user_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT CASE 
    WHEN public.get_subscription_tier(_user_id) IN ('pro', 'team') THEN true
    WHEN public.get_monthly_report_count(_user_id) < 5 THEN true
    ELSE false
  END
$function$;