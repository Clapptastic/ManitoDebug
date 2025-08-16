import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  Brain, 
  MessageSquare, 
  Send, 
  Sparkles, 
  TrendingUp, 
  Target, 
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Zap
} from 'lucide-react';

interface AiInsight {
  id: string;
  type: 'trend' | 'risk' | 'opportunity' | 'recommendation';
  title: string;
  description: string;
  confidence: number;
  priority: 'low' | 'medium' | 'high';
  timestamp: Date;
  source: string;
}

interface AiAssistantProps {
  analysisData: any;
  competitors: any[];
}

export const AiAssistant: React.FC<AiAssistantProps> = ({ analysisData, competitors }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [insights, setInsights] = useState<AiInsight[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [chatHistory, setChatHistory] = useState<Array<{type: 'user' | 'ai', message: string, timestamp: Date}>>([]);

  // Generate AI insights on mount
  useEffect(() => {
    generateInsights();
  }, [competitors, analysisData]);

  const generateInsights = async () => {
    setIsGenerating(true);
    
    // Simulate AI analysis delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const generatedInsights: AiInsight[] = [
      {
        id: '1',
        type: 'trend',
        title: 'Emerging Market Consolidation',
        description: 'AI detects a 23% increase in merger activity among mid-tier competitors, suggesting market consolidation trend.',
        confidence: 87,
        priority: 'high',
        timestamp: new Date(),
        source: 'Market Intelligence Engine'
      },
      {
        id: '2',
        type: 'opportunity',
        title: 'Underserved Enterprise Segment',
        description: 'Analysis reveals a gap in enterprise solutions with 34% of large companies seeking alternatives.',
        confidence: 92,
        priority: 'high',
        timestamp: new Date(),
        source: 'Competitive Gap Analysis'
      },
      {
        id: '3',
        type: 'risk',
        title: 'Competitive Price Pressure',
        description: 'Leading competitor reduced pricing by 15%, potentially affecting market positioning.',
        confidence: 78,
        priority: 'medium',
        timestamp: new Date(),
        source: 'Pricing Intelligence'
      },
      {
        id: '4',
        type: 'recommendation',
        title: 'Strategic Partnership Opportunity',
        description: 'AI recommends exploring partnerships with cloud providers based on competitor analysis.',
        confidence: 85,
        priority: 'medium',
        timestamp: new Date(),
        source: 'Strategic Advisor AI'
      }
    ];
    
    setInsights(generatedInsights);
    setIsGenerating(false);
  };

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    const userMessage = message;
    setMessage('');
    
    // Add user message to chat
    setChatHistory(prev => [...prev, {
      type: 'user',
      message: userMessage,
      timestamp: new Date()
    }]);
    
    // Simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Generate AI response based on message
    let aiResponse = generateAiResponse(userMessage);
    
    setChatHistory(prev => [...prev, {
      type: 'ai',
      message: aiResponse,
      timestamp: new Date()
    }]);
  };

  const generateAiResponse = (userMessage: string): string => {
    const lowercaseMessage = userMessage.toLowerCase();
    
    if (lowercaseMessage.includes('market share') || lowercaseMessage.includes('share')) {
      return `Based on your competitor analysis, the market share distribution shows significant concentration among top 3 players. The leading competitor holds ${competitors[0]?.market_share || 'N/A'}% while emerging players are gaining traction in niche segments.`;
    }
    
    if (lowercaseMessage.includes('threat') || lowercaseMessage.includes('risk')) {
      return `I've identified several competitive threats: 1) Price competition from established players, 2) Technology disruption from startups, 3) Market consolidation reducing opportunities. The highest risk competitor appears to be those with strong funding and rapid growth.`;
    }
    
    if (lowercaseMessage.includes('opportunity') || lowercaseMessage.includes('gap')) {
      return `Key opportunities detected: 1) Underserved mid-market segment, 2) Emerging technology integration gaps, 3) Geographic expansion possibilities. Focus on areas where competitors show weakness or limited presence.`;
    }
    
    if (lowercaseMessage.includes('recommendation') || lowercaseMessage.includes('strategy')) {
      return `Strategic recommendations: 1) Differentiate through superior customer experience, 2) Invest in emerging technologies, 3) Consider strategic partnerships, 4) Focus on underserved market segments. Prioritize based on your resource capabilities.`;
    }
    
    return `I've analyzed your competitor data and can provide insights on market trends, competitive positioning, risks, and opportunities. Try asking about specific aspects like "What are the main threats?" or "Where are the market opportunities?"`;
  };

  const getInsightIcon = (type: string) => {
    switch (type) {
      case 'trend': return TrendingUp;
      case 'risk': return AlertTriangle;
      case 'opportunity': return Target;
      case 'recommendation': return Lightbulb;
      default: return Brain;
    }
  };

  const getInsightColor = (type: string) => {
    switch (type) {
      case 'trend': return 'text-blue-500';
      case 'risk': return 'text-red-500';
      case 'opportunity': return 'text-green-500';
      case 'recommendation': return 'text-purple-500';
      default: return 'text-gray-500';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <>
      {/* AI Insights Panel */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-500" />
            AI-Powered Insights
            <Badge variant="secondary" className="ml-auto">
              {insights.length} insights
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isGenerating ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid gap-4">
              {insights.map((insight, index) => {
                const Icon = getInsightIcon(insight.type);
                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start gap-3">
                      <Icon className={`w-5 h-5 mt-0.5 ${getInsightColor(insight.type)}`} />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-semibold">{insight.title}</h4>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(insight.priority)}`}></div>
                          <Badge variant="outline" className="text-xs">
                            {insight.confidence}% confidence
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{insight.description}</p>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>{insight.source}</span>
                          <span>{insight.timestamp.toLocaleTimeString()}</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* AI Assistant Chat Toggle */}
      <motion.div
        className="fixed bottom-6 right-6 z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1 }}
      >
        <Button
          onClick={() => setIsOpen(!isOpen)}
          className="rounded-full w-14 h-14 shadow-lg bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
        >
          <MessageSquare className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* AI Chat Interface */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="fixed bottom-24 right-6 w-96 z-50"
          >
            <Card className="shadow-2xl border-2">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-blue-500 text-primary-foreground rounded-t-lg">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  AI Competitive Intelligence
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="ml-auto text-primary-foreground hover:bg-primary-foreground/20"
                  >
                    ×
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                {/* Chat History */}
                <div className="h-64 overflow-y-auto p-4 space-y-3">
                  {chatHistory.length === 0 && (
                    <div className="text-center text-muted-foreground py-8">
                      <Brain className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">Ask me anything about your competitive analysis!</p>
                      <div className="mt-3 space-y-1 text-xs">
                        <p>"What are the main threats?"</p>
                        <p>"Where are market opportunities?"</p>
                        <p>"Who has the largest market share?"</p>
                      </div>
                    </div>
                  )}
                  
                  {chatHistory.map((chat, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex gap-2 ${chat.type === 'user' ? 'justify-end' : ''}`}
                    >
                      {chat.type === 'ai' && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback className="bg-purple-100">
                            <Brain className="w-4 h-4 text-purple-600" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <div className={`max-w-[80%] p-3 rounded-lg text-sm ${
                        chat.type === 'user' 
                          ? 'bg-primary text-primary-foreground' 
                          : 'bg-muted'
                      }`}>
                        {chat.message}
                      </div>
                      {chat.type === 'user' && (
                        <Avatar className="w-8 h-8">
                          <AvatarFallback>U</AvatarFallback>
                        </Avatar>
                      )}
                    </motion.div>
                  ))}
                </div>
                
                {/* Message Input */}
                <div className="border-t p-4">
                  <div className="flex gap-2">
                    <Input
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Ask about your competitors..."
                      onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1"
                    />
                    <Button onClick={handleSendMessage} size="sm">
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};