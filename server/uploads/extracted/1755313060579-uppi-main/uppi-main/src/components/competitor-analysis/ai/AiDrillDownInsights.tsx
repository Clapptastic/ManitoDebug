import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Brain, Send, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface AiDrillDownInsightsProps {
  analysisId: string;
  analysisData?: any;
}

interface DrillDownSession {
  id: string;
  session_id: string;
  user_prompt: string;
  ai_response: string;
  provider: string;
  model: string;
  estimated_cost: number;
  created_at: string;
}

export const AiDrillDownInsights: React.FC<AiDrillDownInsightsProps> = ({
  analysisId,
  analysisData
}) => {
  const [userPrompt, setUserPrompt] = useState('');
  const [aiProvider, setAiProvider] = useState('openai');
  const [model, setModel] = useState('gpt-4');
  const [loading, setLoading] = useState(false);
  const [sessions, setSessions] = useState<DrillDownSession[]>([]);

  const handleSubmit = async () => {
    if (!userPrompt.trim()) {
      toast({
        title: 'Prompt Required',
        description: 'Please enter a question or prompt for AI analysis.',
        variant: 'destructive'
      });
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-drill-down', {
        body: {
          analysisId,
          userPrompt,
          aiProvider,
          model
        }
      });

      if (error) throw error;

      const newSession: DrillDownSession = {
        id: data.session_id,
        session_id: data.session_id,
        user_prompt: userPrompt,
        ai_response: data.ai_response,
        provider: aiProvider,
        model,
        estimated_cost: data.estimated_cost || 0,
        created_at: new Date().toISOString()
      };

      setSessions(prev => [newSession, ...prev]);
      setUserPrompt('');

      toast({
        title: 'AI Analysis Complete',
        description: 'Your custom analysis has been generated successfully.',
      });
    } catch (error: any) {
      console.error('AI drill-down error:', error);
      toast({
        title: 'Analysis Failed',
        description: error.message || 'Failed to generate AI analysis',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Brain className="h-6 w-6 text-primary" />
          <h3 className="text-xl font-semibold">AI Drill-Down Insights</h3>
        </div>
        <p className="text-muted-foreground text-sm">
          Ask specific questions about this competitor analysis and get AI-powered insights
        </p>
      </div>

      {/* AI Query Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Ask AI About This Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">AI Provider</label>
              <Select value={aiProvider} onValueChange={setAiProvider}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Model</label>
              <Select value={model} onValueChange={setModel}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {aiProvider === 'openai' && (
                    <>
                      <SelectItem value="gpt-4">GPT-4</SelectItem>
                      <SelectItem value="gpt-4-turbo">GPT-4 Turbo</SelectItem>
                      <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
                    </>
                  )}
                  {aiProvider === 'anthropic' && (
                    <>
                      <SelectItem value="claude-3-opus">Claude 3 Opus</SelectItem>
                      <SelectItem value="claude-3-sonnet">Claude 3 Sonnet</SelectItem>
                      <SelectItem value="claude-3-haiku">Claude 3 Haiku</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Your Question</label>
            <Textarea
              value={userPrompt}
              onChange={(e) => setUserPrompt(e.target.value)}
              placeholder="Ask specific questions like: 'What are the key competitive advantages?', 'How vulnerable is this company to market disruption?', 'What strategic recommendations do you have?'"
              rows={3}
              className="resize-none"
            />
          </div>

          <Button onClick={handleSubmit} disabled={loading || !userPrompt.trim()} className="w-full">
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Get AI Insights
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* AI Sessions History */}
      {sessions.length > 0 && (
        <div className="space-y-4">
          <h4 className="font-semibold text-lg">Previous Insights</h4>
          {sessions.map((session) => (
            <Card key={session.id} className="border-l-4 border-l-primary">
              <CardContent className="p-6 space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{session.provider}</Badge>
                    <Badge variant="secondary">{session.model}</Badge>
                    <span className="text-xs text-muted-foreground">
                      {new Date(session.created_at).toLocaleString()}
                    </span>
                  </div>
                  {session.estimated_cost > 0 && (
                    <Badge variant="outline" className="text-xs">
                      ~${session.estimated_cost.toFixed(4)}
                    </Badge>
                  )}
                </div>
                
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">Your Question:</p>
                    <p className="text-sm bg-muted p-3 rounded italic">"{session.user_prompt}"</p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-1">AI Response:</p>
                    <div className="text-sm bg-primary/5 p-4 rounded border-l-2 border-l-primary">
                      <pre className="whitespace-pre-wrap font-sans leading-relaxed">
                        {session.ai_response}
                      </pre>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

    </div>
  );
};