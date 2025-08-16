import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEnhancedChat } from '@/hooks/useEnhancedChat';
import { useUnifiedApiKeys } from '@/hooks/useUnifiedApiKeys';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Trash2, 
  Bot, 
  User, 
  Settings, 
  Archive,
  Edit,
  Zap,
  Clock,
  DollarSign,
  BarChart3
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';
import { Textarea } from '@/components/ui/textarea';

const EnhancedChatInterface: React.FC = () => {
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    isLoadingSessions,
    error,
    preferences,
    createSession,
    sendMessage,
    deleteSession,
    updateSessionTitle,
    switchSession,
    updatePreferences,
    archiveSession,
    currentSession,
    hasActiveSessions
  } = useEnhancedChat();

  const { hasApiKey, isApiKeyActive } = useUnifiedApiKeys();

  const [inputMessage, setInputMessage] = useState('');
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
    
    await sendMessage(inputMessage);
    setInputMessage('');
    inputRef.current?.focus();
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleEditTitle = async () => {
    if (!editingSessionId || !editingTitle.trim()) return;
    
    await updateSessionTitle(editingSessionId, editingTitle);
    setEditingSessionId(null);
    setEditingTitle('');
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const archivedSessions = sessions.filter(s => s.status === 'archived');

  return (
    <div className="flex h-[calc(100vh-12rem)] gap-4">
      {/* Sessions Sidebar */}
      <div className="w-80 flex flex-col gap-4">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">Chat Sessions</CardTitle>
              <Button onClick={() => createSession()} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="active" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="active">
                  Active ({activeSessions.length})
                </TabsTrigger>
                <TabsTrigger value="archived">
                  Archived ({archivedSessions.length})
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="active" className="space-y-2 mt-4">
                <ScrollArea className="h-[300px]">
                  {activeSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No active chats</p>
                      <p className="text-xs">Start a new conversation</p>
                    </div>
                  ) : (
                    activeSessions.map((session) => (
                      <div
                        key={session.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors group ${
                          currentSessionId === session.id 
                            ? 'bg-primary/10 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => switchSession(session.id)}
                      >
                        <div className="flex justify-between items-start mb-2">
                          {editingSessionId === session.id ? (
                            <Input
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={handleEditTitle}
                              onKeyPress={(e) => e.key === 'Enter' && handleEditTitle()}
                              className="h-6 text-sm"
                              autoFocus
                            />
                          ) : (
                            <h4 
                              className="font-medium text-sm truncate flex-1 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingSessionId(session.id);
                                setEditingTitle(session.title);
                              }}
                            >
                              {session.title}
                            </h4>
                          )}
                          
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                archiveSession(session.id);
                              }}
                            >
                              <Archive className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteSession(session.id);
                              }}
                            >
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {session.context?.preferences?.ai_provider || 'openai'}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
              
              <TabsContent value="archived" className="space-y-2 mt-4">
                <ScrollArea className="h-[300px]">
                  {archivedSessions.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Archive className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No archived chats</p>
                    </div>
                  ) : (
                    archivedSessions.map((session) => (
                      <div
                        key={session.id}
                        className="p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors opacity-60"
                        onClick={() => switchSession(session.id)}
                      >
                        <h4 className="font-medium text-sm truncate">{session.title}</h4>
                        <div className="text-xs text-muted-foreground mt-1">
                          Archived {formatDistanceToNow(new Date(session.updated_at), { addSuffix: true })}
                        </div>
                      </div>
                    ))
                  )}
                </ScrollArea>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Settings Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Chat Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="provider" className="text-sm">AI Provider</Label>
              <Select
                value={preferences.provider}
                onValueChange={(value: 'openai' | 'anthropic') => 
                  updatePreferences({ provider: value })
                }
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {hasApiKey('openai') && isApiKeyActive('openai') && (
                    <SelectItem value="openai">OpenAI</SelectItem>
                  )}
                  {hasApiKey('anthropic') && isApiKeyActive('anthropic') && (
                    <SelectItem value="anthropic">Anthropic</SelectItem>
                  )}
                  {!hasApiKey('openai') && !hasApiKey('anthropic') && (
                    <SelectItem value="none" disabled>🔑 No AI providers configured</SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model" className="text-sm">Model</Label>
              <Select
                value={preferences.model}
                onValueChange={(value) => updatePreferences({ model: value })}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {preferences.provider === 'openai' ? (
                    <>
                      <SelectItem value="gpt-5-2025-08-07">GPT-5 (Flagship)</SelectItem>
                      <SelectItem value="gpt-5-mini-2025-08-07">GPT-5 Mini</SelectItem>
                      <SelectItem value="gpt-5-nano-2025-08-07">GPT-5 Nano</SelectItem>
                      <SelectItem value="gpt-4.1-2025-04-14">GPT-4.1</SelectItem>
                      <SelectItem value="o3-2025-04-16">O3 (Reasoning)</SelectItem>
                      <SelectItem value="o4-mini-2025-04-16">O4 Mini (Fast Reasoning)</SelectItem>
                    </>
                  ) : (
                    <>
                      <SelectItem value="claude-opus-4-20250514">Claude 4 Opus (Most Capable)</SelectItem>
                      <SelectItem value="claude-sonnet-4-20250514">Claude 4 Sonnet</SelectItem>
                      <SelectItem value="claude-3-5-haiku-20241022">Claude 3.5 Haiku (Fastest)</SelectItem>
                      <SelectItem value="claude-3-5-sonnet-20241022">Claude 3.5 Sonnet</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm">
                Temperature: {preferences.temperature}
              </Label>
              <Slider
                value={[preferences.temperature]}
                onValueChange={([value]) => updatePreferences({ temperature: value })}
                max={1}
                min={0}
                step={0.1}
                className="mt-2"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="context" className="text-sm">Include Business Context</Label>
              <Switch
                id="context"
                checked={preferences.include_context}
                onCheckedChange={(checked) => updatePreferences({ include_context: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Area */}
      <div className="flex-1">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  {currentSession?.title || 'AI Business Advisor'}
                </CardTitle>
                {currentSession && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Using {preferences.provider} • {preferences.model}
                  </p>
                )}
              </div>
              
              {currentSession && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>
                    {formatDistanceToNow(new Date(currentSession.updated_at), { addSuffix: true })}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0">
            {/* Messages Area */}
            <ScrollArea className="flex-1 p-4">
              {!currentSessionId ? (
                <div className="text-center py-12">
                  <Bot className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Start a New Conversation</h3>
                  <p className="text-muted-foreground mb-4">
                    Get personalized business advice powered by your competitive intelligence and business data.
                  </p>
                  <Button onClick={() => createSession()}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                  </Button>
                </div>
              ) : messages.length === 0 ? (
                <div className="text-center py-12">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                  <h3 className="text-lg font-semibold mb-2">Welcome to AI Business Advisor</h3>
                  <p className="text-muted-foreground mb-4">
                    I have access to your competitor analyses, company profile, and business documents 
                    to provide contextual strategic guidance. What would you like to discuss?
                  </p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    <Button 
                      variant="outline" 
                      onClick={() => setInputMessage('Analyze my top competitors and suggest strategic opportunities')}
                    >
                      Competitor Strategy
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setInputMessage('Review my business plan and suggest improvements')}
                    >
                      Business Plan Review
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setInputMessage('What market trends should I be aware of?')}
                    >
                      Market Insights
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex gap-3 ${
                        message.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                      }`}
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          {message.role === 'user' ? (
                            <User className="h-4 w-4" />
                          ) : (
                            <Bot className="h-4 w-4" />
                          )}
                        </AvatarFallback>
                      </Avatar>
                      
                      <div
                        className={`flex-1 max-w-[80%] ${
                          message.role === 'user' ? 'text-right' : 'text-left'
                        }`}
                      >
                        <div
                          className={`inline-block p-3 rounded-lg ${
                            message.role === 'user'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          {message.role === 'user' ? (
                            <p className="whitespace-pre-wrap">{message.content}</p>
                          ) : (
                            <div className="prose prose-sm max-w-none">
                              <ReactMarkdown>
                                {message.content}
                              </ReactMarkdown>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <span>
                            {formatDistanceToNow(new Date(message.created_at), { addSuffix: true })}
                          </span>
                          
                          {message.metadata?.tokens_used && (
                            <Badge variant="outline" className="text-xs">
                              <Zap className="h-3 w-3 mr-1" />
                              {message.metadata.tokens_used} tokens
                            </Badge>
                          )}
                          
                          {message.metadata?.cost && (
                            <Badge variant="outline" className="text-xs">
                              <DollarSign className="h-3 w-3 mr-1" />
                              ${message.metadata.cost.toFixed(4)}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback>
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="bg-muted rounded-lg p-3">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]" />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]" />
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              )}
            </ScrollArea>

            {/* Input Area */}
            {currentSessionId && (
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Textarea
                    ref={inputRef}
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Ask me about your business strategy, competitors, or market opportunities..."
                    className="min-h-[44px] max-h-32 resize-none"
                    disabled={isLoading}
                  />
                  <Button 
                    onClick={handleSendMessage} 
                    disabled={!inputMessage.trim() || isLoading}
                    size="lg"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                
                {preferences.include_context && (
                  <p className="text-xs text-muted-foreground mt-2">
                    AI has access to your business context for personalized advice
                  </p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default EnhancedChatInterface;