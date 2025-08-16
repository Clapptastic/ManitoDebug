import React from 'react';
import { Helmet } from 'react-helmet-async';
import EnhancedChatInterface from '@/components/chat/EnhancedChatInterface';
import { ErrorBoundaryWithFeedback } from '@/components/common/ErrorBoundaryWithFeedback';

const ChatPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* SEO: Title, Meta, Canonical */}
      <Helmet>
        <title>AI Business Advisor Chat | Entrepreneur Guidance</title>
        <meta name="description" content="Chat with the AI Business Advisor for market research, competitor analysis, and startup strategy." />
        <link rel="canonical" href="/chat" />
      </Helmet>

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold">AI Business Advisor</h1>
        <p className="text-muted-foreground">
          Get personalized business advice powered by your competitive intelligence and business data.
          The AI can use your analyses, company profile, business plans, and documents for contextual guidance.
        </p>
      </div>

      {/* Chat interface with error boundary */}
      <ErrorBoundaryWithFeedback fallback="AI Chat is temporarily unavailable">
        <EnhancedChatInterface />
      </ErrorBoundaryWithFeedback>
    </div>
  );
};

export default ChatPage;
