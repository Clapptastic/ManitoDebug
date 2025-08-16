import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAIChat } from '@/hooks/useAIChat';
import { MessageCircle, Send, Plus, Trash2, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatInterface: React.FC = () => {
  const {
    messages,
    sessions,
    currentSessionId,
    isLoading,
    isLoadingSessions,
    loadSessions,
    loadMessages,
    sendMessage,
    startNewSession,
    deleteSession,
  } = useAIChat();

  const [inputMessage, setInputMessage] = useState('');
  const [aiProvider, setAiProvider] = useState<'openai' | 'anthropic'>('openai');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage, aiProvider);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar - Chat Sessions */}
      <div className="w-80 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              AI Assistant
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={startNewSession}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              New Chat
            </Button>
          </div>
          
          {/* AI Provider Selection */}
          <div className="flex gap-2">
            <Button
              variant={aiProvider === 'openai' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAiProvider('openai')}
              className="flex-1"
            >
              OpenAI
            </Button>
            <Button
              variant={aiProvider === 'anthropic' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setAiProvider('anthropic')}
              className="flex-1"
            >
              Claude
            </Button>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-2">
            {isLoadingSessions ? (
              <div className="text-center text-muted-foreground py-4">
                Loading sessions...
              </div>
            ) : sessions.length === 0 ? (
              <div className="text-center text-muted-foreground py-4">
                No chat sessions yet.
                <br />
                Start a new conversation!
              </div>
            ) : (
              sessions.map((session) => (
                <div
                  key={session.id}
                  className={`p-3 mb-2 rounded-lg border cursor-pointer transition-colors group hover:bg-muted/50 ${
                    currentSessionId === session.id ? 'bg-muted border-primary' : 'border-border'
                  }`}
                  onClick={() => loadMessages(session.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {session.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.updated_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {currentSessionId ? (
          <>
            {/* Chat Header */}
            <div className="p-4 border-b border-border">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold">AI Business Assistant</h3>
                  <p className="text-sm text-muted-foreground">
                    Get expert guidance on your startup journey
                  </p>
                </div>
                <Badge variant="secondary">
                  {aiProvider === 'openai' ? 'GPT-4' : 'Claude 3'}
                </Badge>
              </div>
            </div>

            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <Bot className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <h4 className="text-lg font-medium mb-2">
                      Hi! I'm your AI business assistant
                    </h4>
                    <p className="text-sm max-w-md mx-auto">
                      I can help you with market research, business planning, MVP development, 
                      fundraising strategies, and more. What would you like to work on today?
                    </p>
                  </div>
                ) : (
                  messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 ${
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      {message.role === 'assistant' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`max-w-[70%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-primary text-primary-foreground ml-auto'
                            : 'bg-muted'
                        }`}
                      >
                        {message.role === 'assistant' ? (
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <ReactMarkdown>
                              {message.content}
                            </ReactMarkdown>
                          </div>
                        ) : (
                          <p className="text-sm">{message.content}</p>
                        )}
                        
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs opacity-70">
                            {new Date(message.created_at).toLocaleTimeString()}
                          </span>
                          {message.metadata?.model && (
                            <Badge variant="outline" className="text-xs">
                              {message.metadata.model}
                            </Badge>
                          )}
                        </div>
                      </div>
                      
                      {message.role === 'user' && (
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-secondary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t border-border">
              <div className="flex gap-2">
                <Input
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask me anything about your business..."
                  disabled={isLoading}
                  className="flex-1"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={isLoading || !inputMessage.trim()}
                  size="icon"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {isLoading && (
                <div className="text-xs text-muted-foreground mt-2 flex items-center gap-2">
                  <div className="h-2 w-2 bg-primary rounded-full animate-pulse" />
                  AI is thinking...
                </div>
              )}
            </div>
          </>
        ) : (
          /* Welcome Screen */
          <div className="flex-1 flex items-center justify-center p-8">
            <Card className="w-full max-w-md">
              <CardHeader className="text-center">
                <CardTitle className="flex items-center justify-center gap-2">
                  <Bot className="h-6 w-6" />
                  AI Business Assistant
                </CardTitle>
              </CardHeader>
              <CardContent className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Start a new conversation to get expert guidance on:
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <Badge variant="outline">Market Research</Badge>
                  <Badge variant="outline">Business Planning</Badge>
                  <Badge variant="outline">MVP Development</Badge>
                  <Badge variant="outline">Fundraising</Badge>
                  <Badge variant="outline">Growth Strategy</Badge>
                  <Badge variant="outline">Validation</Badge>
                </div>
                <Separator />
                <Button onClick={startNewSession} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Start New Conversation
                </Button>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;