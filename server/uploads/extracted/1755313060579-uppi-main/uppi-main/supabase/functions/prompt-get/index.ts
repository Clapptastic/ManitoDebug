import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Content-Type": "application/json"
};

type PromptResponse = {
  key: string;
  provider: string;
  domain: string;
  description: string | null;
  is_active: boolean;
  version: number | null;
  content: string | null;
  metadata: Record<string, unknown> | null;
  variables: unknown[];
  updated_at: string | null;
};

// Simple in-memory cache with TTL per function instance
const CACHE_TTL_MS = 60_000; // 60s
const cache = new Map<string, { data: PromptResponse; expiresAt: number }>();

function getCache(key: string): PromptResponse | null {
  const hit = cache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    cache.delete(key);
    return null;
  }
  return hit.data;
}

function setCache(key: string, data: PromptResponse) {
  cache.set(key, { data, expiresAt: Date.now() + CACHE_TTL_MS });
}

serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const method = req.method.toUpperCase();

    let key = url.searchParams.get("key");
    if (!key && method === "POST") {
      const body = await req.json().catch(() => ({}));
      key = body?.key;
    }

    if (!key || typeof key !== "string") {
      return new Response(JSON.stringify({ error: "Missing 'key' parameter" }), {
        status: 400,
        headers: corsHeaders,
      });
    }

    // Cache check
    const cached = getCache(key);
    if (cached) {
      return new Response(JSON.stringify({ source: "cache", ...cached }), {
        headers: corsHeaders,
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Try to get authenticated user but don't fail if not present (fallback to service role access)
    const authHeader = req.headers.get('authorization');
    let user = null;
    
    if (authHeader) {
      try {
        const { data: userData, error: authError } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
        if (!authError && userData?.user) {
          user = userData.user;
        }
      } catch (e) {
        console.warn('Auth validation failed, proceeding with service role:', e);
      }
    }

    // Fetch prompt by key
    const { data: prompt, error: pErr } = await supabase
      .from("prompts")
      .select("id, key, provider, domain, description, is_active, current_version_id, updated_at")
      .eq("key", key)
      .maybeSingle();

    if (pErr) throw pErr;
    if (!prompt) {
      return new Response(JSON.stringify({ error: "Prompt not found", key }), {
        status: 404,
        headers: corsHeaders,
      });
    }

    // Resolve current version (either via current_version_id or latest)
    let versionRow: any | null = null;

    if (prompt.current_version_id) {
      const { data: v, error: vErr } = await supabase
        .from("prompt_versions")
        .select("id, version, content, metadata, created_at")
        .eq("id", prompt.current_version_id)
        .maybeSingle();
      if (vErr) throw vErr;
      versionRow = v;
    }

    if (!versionRow) {
      const { data: v2, error: vErr2 } = await supabase
        .from("prompt_versions")
        .select("id, version, content, metadata, created_at")
        .eq("prompt_id", prompt.id)
        .order("version", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (vErr2) throw vErr2;
      versionRow = v2;
    }

    const metadata = (versionRow?.metadata ?? {}) as Record<string, unknown>;
    const variables = Array.isArray((metadata as any)["variables"]) ? (metadata as any)["variables"] : [];

    const response: PromptResponse = {
      key: prompt.key,
      provider: prompt.provider,
      domain: prompt.domain,
      description: prompt.description,
      is_active: prompt.is_active,
      version: versionRow?.version ?? null,
      content: versionRow?.content ?? null,
      metadata: metadata,
      variables,
      updated_at: prompt.updated_at ?? null,
    };

    setCache(key, response);

    return new Response(JSON.stringify({ source: "db", ...response }), {
      headers: corsHeaders,
    });
  } catch (error) {
    console.error("prompt-get error:", error);
    // Fallback: if DB access fails (e.g., permission denied), return a safe default prompt
    try {
      const url = new URL(req.url);
      const keyParam = url.searchParams.get("key") || "ai_cofounder_assistant";
      const fallback = {
        key: keyParam,
        provider: "openai",
        domain: "system",
        description: "Default AI Co-founder Assistant prompt",
        is_active: true,
        version: 1,
        content: "You are an AI Co-founder and Business Advisor. Provide actionable, prioritized guidance grounded in the user's business context, competitor insights, and goals. Be concise, structured, and cite assumptions.",
        metadata: {},
        variables: [],
        updated_at: new Date().toISOString(),
      } as PromptResponse;
      return new Response(JSON.stringify({ source: "fallback", ...fallback }), {
        headers: corsHeaders,
      });
    } catch (_) {
      return new Response(JSON.stringify({ error: String(error) }), {
        status: 500,
        headers: corsHeaders,
      });
    }
  }
});