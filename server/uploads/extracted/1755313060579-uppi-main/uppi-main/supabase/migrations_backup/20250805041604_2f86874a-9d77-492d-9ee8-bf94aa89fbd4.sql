-- Only add the missing tables needed by the codebase (without duplicating triggers)

-- Create api_usage_costs table for API cost tracking
CREATE TABLE IF NOT EXISTS public.api_usage_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    provider TEXT NOT NULL,
    service TEXT NOT NULL,
    cost_usd DECIMAL(10,4) NOT NULL DEFAULT 0,
    usage_count INTEGER NOT NULL DEFAULT 0,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create competitor_analysis_progress table
CREATE TABLE IF NOT EXISTS public.competitor_analysis_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id TEXT NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    total_competitors INTEGER NOT NULL DEFAULT 0,
    completed_competitors INTEGER NOT NULL DEFAULT 0,
    current_competitor TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    progress_percentage DECIMAL(5,2) NOT NULL DEFAULT 0,
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create performance_metrics table
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    metric_name TEXT NOT NULL,
    metric_value DECIMAL(10,4) NOT NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create affiliate_programs table
CREATE TABLE IF NOT EXISTS public.affiliate_programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_name TEXT NOT NULL,
    affiliate_code TEXT NOT NULL,
    commission_rate DECIMAL(5,2),
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS policies
ALTER TABLE public.api_usage_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.competitor_analysis_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_programs ENABLE ROLS LEVEL SECURITY;