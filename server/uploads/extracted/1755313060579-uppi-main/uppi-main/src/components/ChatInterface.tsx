
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useSecureOpenAI } from "@/hooks/useSecureOpenAI";

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const ChatInterface = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: 'Hello! I\'m your AI startup advisor. How can I help you today?',
      isUser: false,
      timestamp: new Date()
    }
  ]);
  const { callChatAPI, isLoading } = useSecureOpenAI();
  

  const handleSendMessage = async (input: string) => {
    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      isUser: true,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    try {
      const systemPrompt = `You are an expert AI entrepreneurship advisor with deep knowledge in startup strategy, market validation, MVP development, fundraising, and business growth. 

Provide practical, actionable advice for entrepreneurs at any stage. Focus on:
- Lean startup methodologies
- Market validation techniques
- MVP development strategies
- Customer development
- Business model design
- Fundraising guidance
- Growth hacking tactics

Keep responses concise but comprehensive, and always provide concrete next steps.`;

      const response = await callChatAPI([
        { role: 'system', content: systemPrompt },
        ...messages.map(msg => ({ role: msg.isUser ? 'user' : 'assistant', content: msg.text })),
        { role: 'user', content: input }
      ]);

      if (response?.content) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.content,
          isUser: false,
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get response from AI. Please check your API configuration.",
        variant: "destructive"
      });
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-6 h-6" />
          AI Startup Advisor
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.isUser
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                {message.text}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-muted p-3 rounded-lg">
                <div className="flex items-center space-x-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                  <span>AI is thinking...</span>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="mt-4">
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const input = formData.get('message') as string;
            if (input.trim()) {
              handleSendMessage(input);
              e.currentTarget.reset();
            }
          }}>
            <div className="flex gap-2">
              <input
                name="message"
                placeholder="Type your message..."
                className="flex-1 px-3 py-2 border rounded-md"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </form>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
