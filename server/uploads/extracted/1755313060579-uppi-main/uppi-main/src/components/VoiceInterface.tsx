import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { RealtimeChat } from '@/utils/RealtimeAudio';

/**
 * VoiceInterface
 * - Minimal UI to start/stop a voice conversation with OpenAI Realtime via WebRTC
 * - Uses design system Button variants and global toast helper
 */
interface VoiceInterfaceProps {
  onSpeakingChange?: (speaking: boolean) => void;
  model?: string;
  voice?: string; // Supported: alloy, ash, ballad, coral, echo, sage, shimmer, verse
}

const VoiceInterface: React.FC<VoiceInterfaceProps> = ({ onSpeakingChange, model, voice }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const chatRef = useRef<RealtimeChat | null>(null);

  const handleMessage = (event: any) => {
    // Basic speaking state hints (can be improved by parsing more events)
    if (event?.type === 'response.audio.delta') {
      onSpeakingChange?.(true);
    } else if (event?.type === 'response.audio.done') {
      onSpeakingChange?.(false);
    }
  };

  const startConversation = async () => {
    try {
      setIsLoading(true);
      chatRef.current = new RealtimeChat(handleMessage);
      await chatRef.current.init(model, voice);
      setIsConnected(true);
      toast({ title: 'Connected', description: 'Voice interface is ready.' });
    } catch (error) {
      console.error('Error starting conversation:', error);
      // Improve user-facing errors for missing/invalid API keys and generic failures
      const raw = error instanceof Error ? error.message : 'Failed to start conversation';
      const keyIssuesRegex = /(no active\s+openai\s+api key|unauthorized|missing key|invalid key|invalid_api_key|incorrect api key provided|invalid openai api key format)/i;
      const isKeyIssue = keyIssuesRegex.test(raw);

      // Map Supabase client generic error to a clearer message
      const description = raw === 'Edge Function returned a non-2xx status code'
        ? 'Unable to start voice chat. Please add or fix your OpenAI API key in Settings > API Keys and try again.'
        : raw;

      // Provide a direct action to fix API keys when applicable
      const action = isKeyIssue ? (
        <Link to="/api-keys" className="underline font-medium">Manage API Keys</Link>
      ) : undefined;

      toast({ title: 'Error', description, variant: 'destructive', action });
    } finally {
      setIsLoading(false);
    }
  };

  const endConversation = () => {
    chatRef.current?.disconnect();
    setIsConnected(false);
    onSpeakingChange?.(false);
  };

  useEffect(() => () => chatRef.current?.disconnect(), []);

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4">
      {!isConnected ? (
        <Button onClick={startConversation} variant="default" disabled={isLoading} aria-busy={isLoading}>
          {isLoading ? 'Connecting…' : 'Start Conversation'}
        </Button>
      ) : (
        <Button onClick={endConversation} variant="secondary">
          End Conversation
        </Button>
      )}
    </div>
  );
};

export default VoiceInterface;
