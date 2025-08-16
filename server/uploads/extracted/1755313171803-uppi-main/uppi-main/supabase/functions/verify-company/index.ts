
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function normalizeUrl(url: string): string {
  if (!url) return '';
  
  // Remove protocol if present and www
  url = url.replace(/^(https?:\/\/)?(www\.)?/, '');
  // Remove trailing slash and query parameters
  url = url.replace(/[/?#].*$/, '');
  return url.toLowerCase();
}

async function verifyCompanyWebsite(companyName: string, url: string): Promise<boolean> {
  try {
    console.log(`Attempting to verify ${companyName} through URL: ${url}`);
    const response = await fetch(url.startsWith('http') ? url : `https://${url}`);
    if (!response.ok) {
      console.log(`Failed to fetch URL: ${url}, status: ${response.status}`);
      return false;
    }
    const text = await response.text();
    const normalizedCompanyName = companyName.toLowerCase();
    const normalizedContent = text.toLowerCase();
    return normalizedContent.includes(normalizedCompanyName);
  } catch (error) {
    console.error('URL verification error:', error);
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { companyName, url } = await req.json();
    console.log(`Received verification request for company: ${companyName}, URL: ${url}`);
    
    if (!companyName) {
      throw new Error('Company name is required');
    }

    // First, try to verify through the provided URL
    if (url) {
      const normalizedUrl = normalizeUrl(url);
      console.log(`Normalized URL: ${normalizedUrl}`);
      
      const isVerified = await verifyCompanyWebsite(companyName, url);
      if (isVerified) {
        console.log(`Company verified through website: ${url}`);
        return new Response(
          JSON.stringify({
            verified: true,
            confidence: 0.9,
            verifiedName: companyName,
            url: url,
            suggestedUrls: [url]
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // If URL verification fails or no URL provided, use AI to suggest URLs
    console.log('Website verification failed or no URL provided, using AI for suggestions');
    const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are a company verification assistant. Return JSON with company verification info.'
          },
          {
            role: 'user',
            content: `Verify this company: "${companyName}". Return a JSON object with:
            1. verified (boolean): your confidence if this is a real company
            2. confidence (number 0-1): your confidence in the verification
            3. suggestedUrls (array): likely official website URLs
            4. verifiedName (string): the correct company name
            5. description (string): brief company description`
          }
        ],
      }),
    });

    const aiResponse = await response.json();
    const result = JSON.parse(aiResponse.choices[0].message.content);
    console.log('AI verification result:', result);

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Company verification error:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        verified: false,
        confidence: 0,
        suggestedUrls: []
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
