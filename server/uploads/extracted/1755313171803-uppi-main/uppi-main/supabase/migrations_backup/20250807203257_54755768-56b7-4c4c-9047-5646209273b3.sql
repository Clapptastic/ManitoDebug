-- PHASE 3: DATA FLOW & MONITORING ENHANCEMENTS
-- Comprehensive audit trail and transaction management

-- Enhanced audit logging with better categorization
CREATE TABLE IF NOT EXISTS public.system_health_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL,
    metric_value NUMERIC NOT NULL,
    metric_unit TEXT DEFAULT '',
    component TEXT NOT NULL, -- 'database', 'api', 'edge_functions', etc.
    severity TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'critical'
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Performance monitoring for slow operations
CREATE TABLE IF NOT EXISTS public.performance_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_name TEXT NOT NULL,
    execution_time_ms INTEGER NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    request_id TEXT,
    component TEXT NOT NULL,
    status TEXT DEFAULT 'success', -- 'success', 'error', 'timeout'
    error_details JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Transaction state tracking for multi-step operations
CREATE TABLE IF NOT EXISTS public.transaction_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_id TEXT NOT NULL UNIQUE,
    user_id UUID REFERENCES auth.users(id),
    operation_type TEXT NOT NULL,
    current_step INTEGER DEFAULT 1,
    total_steps INTEGER NOT NULL,
    status TEXT DEFAULT 'in_progress', -- 'in_progress', 'completed', 'failed', 'rolled_back'
    steps_completed JSONB DEFAULT '[]',
    rollback_data JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    completed_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Real-time subscription tracking
CREATE TABLE IF NOT EXISTS public.realtime_subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    channel_name TEXT NOT NULL,
    subscription_type TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    connection_id TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    last_activity_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    disconnected_at TIMESTAMP WITH TIME ZONE
);

-- Memory usage and leak detection
CREATE TABLE IF NOT EXISTS public.memory_usage_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    component TEXT NOT NULL,
    memory_usage_mb NUMERIC NOT NULL,
    peak_memory_mb NUMERIC,
    active_connections INTEGER DEFAULT 0,
    active_subscriptions INTEGER DEFAULT 0,
    garbage_collections INTEGER DEFAULT 0,
    memory_leaks_detected INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.system_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.realtime_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_usage_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_health_metrics
CREATE POLICY "Admins can view all system health metrics" 
ON public.system_health_metrics FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Service role can insert health metrics" 
ON public.system_health_metrics FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for performance_logs
CREATE POLICY "Users can view their own performance logs" 
ON public.performance_logs FOR SELECT 
USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Service role can insert performance logs" 
ON public.performance_logs FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- RLS Policies for transaction_logs
CREATE POLICY "Users can view their own transaction logs" 
ON public.transaction_logs FOR ALL 
USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']))
WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for realtime_subscriptions
CREATE POLICY "Users can manage their own subscriptions" 
ON public.realtime_subscriptions FOR ALL 
USING (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']))
WITH CHECK (auth.uid() = user_id OR get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

-- RLS Policies for memory_usage_logs
CREATE POLICY "Admins can view memory usage logs" 
ON public.memory_usage_logs FOR SELECT 
USING (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin']));

CREATE POLICY "Service role can insert memory logs" 
ON public.memory_usage_logs FOR INSERT 
WITH CHECK (auth.role() = 'service_role');

-- Enhanced functions for transaction management
CREATE OR REPLACE FUNCTION public.start_transaction_log(
    user_id_param UUID,
    operation_type_param TEXT,
    total_steps_param INTEGER,
    metadata_param JSONB DEFAULT '{}'
) 
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    transaction_id TEXT;
BEGIN
    transaction_id := 'txn_' || extract(epoch from now()) || '_' || substr(gen_random_uuid()::text, 1, 8);
    
    INSERT INTO public.transaction_logs (
        transaction_id,
        user_id,
        operation_type,
        total_steps,
        steps_completed,
        rollback_data
    ) VALUES (
        transaction_id,
        user_id_param,
        operation_type_param,
        total_steps_param,
        '[]'::jsonb,
        metadata_param
    );
    
    RETURN transaction_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.update_transaction_step(
    transaction_id_param TEXT,
    step_number INTEGER,
    step_data JSONB DEFAULT '{}',
    rollback_data_param JSONB DEFAULT '{}'
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    current_steps JSONB;
    new_rollback_data JSONB;
BEGIN
    -- Get current steps and rollback data
    SELECT steps_completed, rollback_data INTO current_steps, new_rollback_data
    FROM public.transaction_logs 
    WHERE transaction_id = transaction_id_param;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- Add new step to completed steps
    current_steps := current_steps || jsonb_build_object(
        'step_' || step_number, 
        jsonb_build_object(
            'completed_at', now(),
            'data', step_data
        )
    );
    
    -- Merge rollback data
    new_rollback_data := new_rollback_data || rollback_data_param;
    
    -- Update the transaction log
    UPDATE public.transaction_logs 
    SET 
        current_step = step_number,
        steps_completed = current_steps,
        rollback_data = new_rollback_data,
        updated_at = now()
    WHERE transaction_id = transaction_id_param;
    
    RETURN TRUE;
END;
$$;

CREATE OR REPLACE FUNCTION public.complete_transaction(
    transaction_id_param TEXT,
    success BOOLEAN DEFAULT TRUE
) 
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    UPDATE public.transaction_logs 
    SET 
        status = CASE WHEN success THEN 'completed' ELSE 'failed' END,
        completed_at = now(),
        updated_at = now()
    WHERE transaction_id = transaction_id_param;
    
    RETURN FOUND;
END;
$$;

CREATE OR REPLACE FUNCTION public.rollback_transaction(
    transaction_id_param TEXT,
    error_message_param TEXT DEFAULT NULL
) 
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    rollback_info JSONB;
BEGIN
    -- Get rollback data
    SELECT rollback_data INTO rollback_info
    FROM public.transaction_logs 
    WHERE transaction_id = transaction_id_param;
    
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Transaction not found');
    END IF;
    
    -- Update transaction status
    UPDATE public.transaction_logs 
    SET 
        status = 'rolled_back',
        error_message = error_message_param,
        completed_at = now(),
        updated_at = now()
    WHERE transaction_id = transaction_id_param;
    
    RETURN jsonb_build_object(
        'success', true, 
        'transaction_id', transaction_id_param,
        'rollback_data', rollback_info
    );
END;
$$;

-- Function to log performance metrics
CREATE OR REPLACE FUNCTION public.log_performance_metric(
    operation_name_param TEXT,
    execution_time_ms_param INTEGER,
    user_id_param UUID DEFAULT NULL,
    component_param TEXT DEFAULT 'unknown',
    status_param TEXT DEFAULT 'success',
    metadata_param JSONB DEFAULT '{}'
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    INSERT INTO public.performance_logs (
        operation_name,
        execution_time_ms,
        user_id,
        component,
        status,
        metadata
    ) VALUES (
        operation_name_param,
        execution_time_ms_param,
        user_id_param,
        component_param,
        status_param,
        metadata_param
    );
    
    -- Alert if operation is very slow (> 5 seconds)
    IF execution_time_ms_param > 5000 THEN
        INSERT INTO public.system_health_metrics (
            metric_name,
            metric_value,
            metric_unit,
            component,
            severity,
            metadata
        ) VALUES (
            'slow_operation_detected',
            execution_time_ms_param,
            'ms',
            component_param,
            'warning',
            jsonb_build_object(
                'operation', operation_name_param,
                'user_id', user_id_param,
                'execution_time_ms', execution_time_ms_param
            )
        );
    END IF;
END;
$$;

-- Function to track real-time subscriptions
CREATE OR REPLACE FUNCTION public.track_realtime_subscription(
    user_id_param UUID,
    channel_name_param TEXT,
    subscription_type_param TEXT,
    action_param TEXT, -- 'subscribe', 'unsubscribe', 'heartbeat'
    metadata_param JSONB DEFAULT '{}'
) 
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
    IF action_param = 'subscribe' THEN
        INSERT INTO public.realtime_subscriptions (
            user_id,
            channel_name,
            subscription_type,
            metadata
        ) VALUES (
            user_id_param,
            channel_name_param,
            subscription_type_param,
            metadata_param
        )
        ON CONFLICT (user_id, channel_name) 
        DO UPDATE SET 
            is_active = true,
            last_activity_at = now(),
            disconnected_at = NULL;
            
    ELSIF action_param = 'unsubscribe' THEN
        UPDATE public.realtime_subscriptions 
        SET 
            is_active = false,
            disconnected_at = now()
        WHERE user_id = user_id_param 
          AND channel_name = channel_name_param;
          
    ELSIF action_param = 'heartbeat' THEN
        UPDATE public.realtime_subscriptions 
        SET last_activity_at = now()
        WHERE user_id = user_id_param 
          AND channel_name = channel_name_param
          AND is_active = true;
    END IF;
END;
$$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_recorded_at ON public.system_health_metrics(recorded_at);
CREATE INDEX IF NOT EXISTS idx_system_health_metrics_component ON public.system_health_metrics(component);
CREATE INDEX IF NOT EXISTS idx_performance_logs_created_at ON public.performance_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_performance_logs_operation ON public.performance_logs(operation_name);
CREATE INDEX IF NOT EXISTS idx_performance_logs_execution_time ON public.performance_logs(execution_time_ms);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_status ON public.transaction_logs(status);
CREATE INDEX IF NOT EXISTS idx_transaction_logs_user_id ON public.transaction_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_realtime_subscriptions_active ON public.realtime_subscriptions(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_memory_usage_component ON public.memory_usage_logs(component);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_transaction_logs_updated_at
    BEFORE UPDATE ON public.transaction_logs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Create a function to get system health overview
CREATE OR REPLACE FUNCTION public.get_system_health_overview()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
    health_data JSONB;
    active_transactions INTEGER;
    slow_operations INTEGER;
    memory_warnings INTEGER;
    active_subscriptions INTEGER;
BEGIN
    -- Only admins can access system health
    IF NOT (get_user_role(auth.uid()) = ANY (ARRAY['admin', 'super_admin'])) THEN
        RAISE EXCEPTION 'Access denied: Admin privileges required';
    END IF;
    
    -- Count active transactions
    SELECT COUNT(*) INTO active_transactions
    FROM public.transaction_logs
    WHERE status = 'in_progress';
    
    -- Count slow operations in last hour
    SELECT COUNT(*) INTO slow_operations
    FROM public.performance_logs
    WHERE execution_time_ms > 1000 
      AND created_at > now() - interval '1 hour';
    
    -- Count memory warnings in last hour
    SELECT COUNT(*) INTO memory_warnings
    FROM public.system_health_metrics
    WHERE severity IN ('warning', 'error', 'critical')
      AND recorded_at > now() - interval '1 hour';
    
    -- Count active subscriptions
    SELECT COUNT(*) INTO active_subscriptions
    FROM public.realtime_subscriptions
    WHERE is_active = true;
    
    health_data := jsonb_build_object(
        'system_status', CASE 
            WHEN memory_warnings > 10 THEN 'critical'
            WHEN slow_operations > 50 OR memory_warnings > 5 THEN 'warning'
            ELSE 'healthy'
        END,
        'metrics', jsonb_build_object(
            'active_transactions', active_transactions,
            'slow_operations_last_hour', slow_operations,
            'memory_warnings_last_hour', memory_warnings,
            'active_subscriptions', active_subscriptions
        ),
        'timestamp', now()
    );
    
    RETURN health_data;
END;
$$;