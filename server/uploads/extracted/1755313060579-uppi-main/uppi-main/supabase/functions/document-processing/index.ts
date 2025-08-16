import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Lightweight unauthenticated health ping
  if (req.method === 'GET') {
    return new Response(
      JSON.stringify({ success: true, message: 'ok', timestamp: new Date().toISOString() }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    // Get the user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    if (userError || !user) {
      console.error('Authentication error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { documentId, action } = body as { documentId?: string; action?: string };

    if (!documentId || !action) {
      return new Response(
        JSON.stringify({ error: 'Document ID and action are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing document ${documentId} with action: ${action}`);

    // Get document info
    const { data: document, error: docError } = await supabaseClient
      .from('documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', user.id)
      .single();

    if (docError || !document) {
      console.error('Error fetching document:', docError);
      return new Response(
        JSON.stringify({ error: 'Document not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let result = {};

    switch (action) {
      case 'extract_text':
        result = await extractTextFromDocument(document, supabaseClient);
        break;
      case 'analyze_content':
        result = await analyzeDocumentContent(document, supabaseClient);
        break;
      case 'generate_embeddings':
        result = await generateDocumentEmbeddings(document, supabaseClient, user.id);
        break;
      case 'summarize':
        result = await summarizeDocument(document, supabaseClient);
        break;
      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        documentId,
        action,
        result
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in document processing:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function extractTextFromDocument(document: any, supabaseClient: any) {
  console.log(`Extracting text from ${document.file_name}`);
  
  // Download file from storage
  const { data: fileData, error: downloadError } = await supabaseClient.storage
    .from(document.storage_bucket)
    .download(document.file_path);

  if (downloadError) {
    throw new Error(`Failed to download file: ${downloadError.message}`);
  }

  // Mock text extraction based on file type
  let extractedText = '';
  
  if (document.file_type?.includes('text/')) {
    extractedText = await fileData.text();
  } else if (document.file_type?.includes('application/pdf')) {
    // Mock PDF text extraction
    extractedText = `Extracted text from PDF: ${document.file_name}\n\nThis is a sample extracted text from the PDF document. In a real implementation, you would use a PDF parsing library to extract the actual text content.`;
  } else if (document.file_type?.includes('application/')) {
    // Mock document text extraction (Word, etc.)
    extractedText = `Extracted text from document: ${document.file_name}\n\nThis is a sample extracted text from the document. In a real implementation, you would use appropriate document parsing libraries.`;
  } else {
    extractedText = `File type ${document.file_type} is not supported for text extraction.`;
  }

  return {
    extractedText,
    wordCount: extractedText.split(/\s+/).length,
    characterCount: extractedText.length
  };
}

async function analyzeDocumentContent(document: any, supabaseClient: any) {
  console.log(`Analyzing content of ${document.file_name}`);
  
  // First extract text
  const textResult = await extractTextFromDocument(document, supabaseClient);
  
  // Mock content analysis
  const analysis = {
    textStats: textResult,
    sentiment: 'positive',
    keyTopics: ['business', 'technology', 'innovation'],
    readabilityScore: 85,
    language: 'en',
    summary: `This document discusses key business and technology concepts. It contains ${textResult.wordCount} words and appears to be well-structured with a positive tone.`
  };

  return analysis;
}

async function generateDocumentEmbeddings(document: any, supabaseClient: any, userId: string) {
  console.log(`Generating embeddings for ${document.file_name}`);
  
  // Extract text first
  const textResult = await extractTextFromDocument(document, supabaseClient);
  
  // Split text into chunks (mock implementation)
  const chunks = splitTextIntoChunks(textResult.extractedText, 1000);
  
  // Mock embedding generation (in real implementation, would call OpenAI Embeddings API)
  const embeddings = [];
  
  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];
    
    // Generate mock embedding vector (1536 dimensions for OpenAI ada-002)
    const embedding = Array.from({ length: 1536 }, () => Math.random() * 2 - 1);
    
    // Store embedding in database
    const { error: embeddingError } = await supabaseClient
      .from('code_embeddings')
      .insert({
        user_id: userId,
        file_path: document.file_path,
        content: chunk,
        embedding: JSON.stringify(embedding),
        token_count: chunk.split(/\s+/).length
      });

    if (embeddingError) {
      console.error('Error storing embedding:', embeddingError);
    } else {
      embeddings.push({ chunkIndex: i, tokenCount: chunk.split(/\s+/).length });
    }
  }

  return {
    chunksProcessed: chunks.length,
    embeddingsGenerated: embeddings.length,
    totalTokens: embeddings.reduce((sum, e) => sum + e.tokenCount, 0)
  };
}

async function summarizeDocument(document: any, supabaseClient: any) {
  console.log(`Summarizing ${document.file_name}`);
  
  // Extract text first
  const textResult = await extractTextFromDocument(document, supabaseClient);
  
  // Mock summarization (in real implementation, would call AI API)
  const summary = `This is an AI-generated summary of ${document.file_name}. The document contains ${textResult.wordCount} words and covers topics related to business and technology. Key points include strategic planning, implementation details, and performance metrics.`;

  return {
    summary,
    originalWordCount: textResult.wordCount,
    summaryWordCount: summary.split(/\s+/).length,
    compressionRatio: (summary.split(/\s+/).length / textResult.wordCount * 100).toFixed(1) + '%'
  };
}

function splitTextIntoChunks(text: string, maxChunkSize: number): string[] {
  const words = text.split(/\s+/);
  const chunks = [];
  let currentChunk = [];

  for (const word of words) {
    if (currentChunk.join(' ').length + word.length + 1 > maxChunkSize) {
      if (currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '));
        currentChunk = [word];
      } else {
        // Word is longer than max chunk size, add it anyway
        chunks.push(word);
      }
    } else {
      currentChunk.push(word);
    }
  }

  if (currentChunk.length > 0) {
    chunks.push(currentChunk.join(' '));
  }

  return chunks;
}