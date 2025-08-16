import OpenAI from 'openai';

class AIService {
  constructor() {
    this.providers = new Map();
    this.initializeProviders();
  }

  initializeProviders() {
    // OpenAI Provider
    if (process.env.OPENAI_API_KEY) {
      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
      
      this.providers.set('openai', {
        name: 'OpenAI GPT',
        client: openai,
        model: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
        handler: this.handleOpenAI.bind(this)
      });
    }

    // Claude Provider (Anthropic)
    if (process.env.ANTHROPIC_API_KEY) {
      this.providers.set('claude', {
        name: 'Claude',
        apiKey: process.env.ANTHROPIC_API_KEY,
        model: process.env.ANTHROPIC_MODEL || 'claude-3-haiku-20240307',
        handler: this.handleClaude.bind(this)
      });
    }

    // Local Provider (fallback)
    this.providers.set('local', {
      name: 'Local AI',
      handler: this.handleLocal.bind(this)
    });

    console.log(`AI Service initialized with providers: ${Array.from(this.providers.keys()).join(', ')}`);
  }

  async sendMessage(message, context = null, provider = 'local') {
    if (!this.providers.has(provider)) {
      throw new Error(`Provider '${provider}' is not available`);
    }

    const providerConfig = this.providers.get(provider);
    
    try {
      const result = await providerConfig.handler(message, context, providerConfig);
      
      return {
        id: `ai_${Date.now()}`,
        provider,
        response: result.response,
        suggestions: result.suggestions || [],
        confidence: result.confidence || 0.8,
        timestamp: new Date().toISOString(),
        model: providerConfig.model || 'unknown'
      };
    } catch (error) {
      console.error(`AI Provider Error (${provider}):`, error);
      throw new Error(`AI provider '${provider}' failed: ${error.message}`);
    }
  }

  async handleOpenAI(message, context, config) {
    const systemPrompt = this.buildSystemPrompt(context);
    const userMessage = this.buildUserMessage(message, context);

    const completion = await config.client.chat.completions.create({
      model: config.model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage }
      ],
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 1,
      frequency_penalty: 0,
      presence_penalty: 0,
    });

    const response = completion.choices[0]?.message?.content || 'No response generated';
    
    return {
      response,
      suggestions: this.extractSuggestions(response),
      confidence: this.calculateConfidence(completion)
    };
  }

  async handleClaude(message, context, config) {
    const systemPrompt = this.buildSystemPrompt(context);
    const userMessage = this.buildUserMessage(message, context);

    // For now, return a placeholder - would need Anthropic SDK
    // This is where you'd integrate with Anthropic's API
    return {
      response: `Claude Analysis: ${message} (Note: Anthropic integration requires API setup)`,
      suggestions: [
        'Configure ANTHROPIC_API_KEY environment variable',
        'Install @anthropic-ai/sdk package',
        'Implement proper Claude API integration'
      ],
      confidence: 0.5
    };
  }

  async handleLocal(message, context) {
    // Enhanced mock with context-aware responses
    await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing

    let response = '';
    let suggestions = [];

    if (context && context.files) {
      const stats = this.analyzeCodeContext(context);
      response = this.generateContextualResponse(message, stats);
      suggestions = this.generateContextualSuggestions(stats);
    } else {
      response = this.generateGenericResponse(message);
      suggestions = [
        'Run a code scan to get more detailed analysis',
        'Consider adding type annotations for better code clarity',
        'Review error handling patterns across your codebase'
      ];
    }

    return {
      response,
      suggestions,
      confidence: Math.random() * 0.3 + 0.6 // 0.6 to 0.9
    };
  }

  buildSystemPrompt(context) {
    let prompt = `You are Manito, an expert AI code analysis assistant. Your role is to help developers understand their codebase, identify potential improvements, and provide actionable insights.

Guidelines:
- Provide clear, actionable recommendations
- Focus on code quality, security, performance, and maintainability
- Use markdown formatting for better readability
- Be concise but thorough
- Always include specific suggestions when possible

`;

    if (context && context.files) {
      const stats = this.analyzeCodeContext(context);
      prompt += `Current codebase context:
- Files analyzed: ${stats.fileCount}
- Total lines of code: ${stats.totalLines}
- Average complexity: ${stats.avgComplexity.toFixed(1)}
- Issues found: ${stats.issueCount}
- Primary languages: ${stats.languages.join(', ')}
- Large files (>200 lines): ${stats.largeFiles}
- High complexity files: ${stats.complexFiles}

`;
    }

    return prompt;
  }

  buildUserMessage(message, context) {
    let userMessage = message;

    if (context && context.files && message.includes('analyze') || message.includes('review')) {
      // Add relevant code snippets or file information
      const recentFiles = context.files.slice(0, 3);
      userMessage += `\n\nRecent files in context:\n`;
      recentFiles.forEach(file => {
        userMessage += `- ${file.filePath}: ${file.lines} lines, complexity: ${file.complexity}\n`;
      });
    }

    return userMessage;
  }

  analyzeCodeContext(context) {
    const files = context.files || [];
    const conflicts = context.conflicts || [];

    return {
      fileCount: files.length,
      totalLines: files.reduce((sum, f) => sum + (f.lines || 0), 0),
      avgComplexity: files.length > 0 ? files.reduce((sum, f) => sum + (f.complexity || 0), 0) / files.length : 0,
      issueCount: conflicts.length,
      languages: [...new Set(files.map(f => {
        if (f.filePath.endsWith('.jsx') || f.filePath.endsWith('.tsx')) return 'React';
        if (f.filePath.endsWith('.js')) return 'JavaScript';
        if (f.filePath.endsWith('.ts')) return 'TypeScript';
        return 'Unknown';
      }))],
      largeFiles: files.filter(f => (f.lines || 0) > 200).length,
      complexFiles: files.filter(f => (f.complexity || 0) > 5).length
    };
  }

  generateContextualResponse(message, stats) {
    const responses = [
      `Based on your codebase analysis (${stats.fileCount} files, ${stats.totalLines} LOC), here are my insights:\n\n**Code Health Overview:**\n- Average complexity: ${stats.avgComplexity.toFixed(1)} (${stats.avgComplexity > 5 ? 'could be optimized' : 'looks good'})\n- Large files: ${stats.largeFiles} files over 200 lines\n- Issues detected: ${stats.issueCount}\n\n**Key Recommendations:**\n${stats.complexFiles > 0 ? `- Consider refactoring ${stats.complexFiles} high-complexity files\n` : ''}${stats.largeFiles > 0 ? `- Break down ${stats.largeFiles} large files for better maintainability\n` : ''}${stats.issueCount > 0 ? `- Address ${stats.issueCount} identified issues\n` : '- No critical issues found! ✅\n'}`,
      
      `Great question! Looking at your ${stats.languages.join(' and ')} codebase:\n\n**Architecture Analysis:**\n- Codebase size: ${stats.fileCount} files, ${stats.totalLines} lines\n- Code complexity is ${stats.avgComplexity > 5 ? 'moderate to high' : 'well-managed'}\n\n**Improvement Opportunities:**\n${stats.avgComplexity > 3 ? '- Simplify complex functions where possible\n' : ''}${stats.issueCount > 2 ? '- Prioritize fixing structural issues\n' : ''}- Consider implementing automated testing\n- Add comprehensive documentation`,
      
      `Analyzing your request in context of your ${stats.totalLines}-line codebase...\n\n**Current State:**\n- Files: ${stats.fileCount} (${stats.largeFiles} large, ${stats.complexFiles} complex)\n- Primary tech: ${stats.languages.join(', ')}\n- Issues: ${stats.issueCount} found\n\n**My Assessment:**\n${message.toLowerCase().includes('performance') ? '- Performance optimization opportunities exist\n' : ''}${message.toLowerCase().includes('security') ? '- Security review recommended\n' : ''}${message.toLowerCase().includes('refactor') ? '- Several refactoring candidates identified\n' : ''}${message.toLowerCase().includes('clean') ? '- Code cleanup will improve maintainability\n' : ''}- Overall code health: ${stats.avgComplexity < 3 && stats.issueCount < 5 ? 'Good' : stats.avgComplexity < 5 && stats.issueCount < 10 ? 'Fair' : 'Needs attention'}`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  generateContextualSuggestions(stats) {
    const suggestions = [];

    if (stats.complexFiles > 0) {
      suggestions.push(`Refactor ${stats.complexFiles} high-complexity files for better maintainability`);
    }
    
    if (stats.largeFiles > 0) {
      suggestions.push(`Consider splitting ${stats.largeFiles} large files into smaller modules`);
    }
    
    if (stats.issueCount > 5) {
      suggestions.push('Address circular dependencies and architectural issues');
    }
    
    if (stats.avgComplexity > 4) {
      suggestions.push('Implement consistent error handling patterns');
    }

    // Add language-specific suggestions
    if (stats.languages.includes('JavaScript') || stats.languages.includes('TypeScript')) {
      suggestions.push('Consider migrating to TypeScript for better type safety');
    }
    
    if (stats.languages.includes('React')) {
      suggestions.push('Review component composition and state management patterns');
    }

    // Always include a few general suggestions
    suggestions.push('Add comprehensive unit tests');
    suggestions.push('Implement automated code quality checks');

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  generateGenericResponse(message) {
    const responses = [
      `I'd be happy to help with that! However, I'd be able to provide much more specific and valuable insights if you run a code scan first. This would give me context about your codebase structure, complexity, and potential areas for improvement.

In the meantime, here are some general thoughts on your question: "${message}"`,

      `That's a great question about code analysis! While I can provide general guidance, running a scan of your codebase would allow me to give you much more targeted and actionable advice.

For now, regarding "${message}", I can offer some general best practices:`,

      `I understand you're asking about "${message}". To give you the most helpful and specific recommendations, I'd recommend running a code scan first so I can analyze your actual codebase.

Here are some general principles that might help:`
    ];

    return responses[Math.floor(Math.random() * responses.length)];
  }

  extractSuggestions(response) {
    const suggestions = [];
    
    // Extract bullet points and numbered lists as suggestions
    const lines = response.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ') || trimmed.match(/^\d+\./)) {
        const suggestion = trimmed.replace(/^[-*]\s*/, '').replace(/^\d+\.\s*/, '');
        if (suggestion.length > 10 && suggestion.length < 100) {
          suggestions.push(suggestion);
        }
      }
    }

    return suggestions.slice(0, 4); // Limit to 4 suggestions
  }

  calculateConfidence(completion) {
    // Basic confidence calculation based on response quality
    const choice = completion.choices[0];
    if (!choice) return 0.5;

    const responseLength = choice.message?.content?.length || 0;
    const finishReason = choice.finish_reason;

    let confidence = 0.7; // Base confidence

    // Adjust based on completion quality
    if (finishReason === 'stop') confidence += 0.1;
    if (responseLength > 100) confidence += 0.1;
    if (responseLength > 300) confidence += 0.1;

    return Math.min(confidence, 0.95);
  }

  getAvailableProviders() {
    return Array.from(this.providers.keys()).map(key => ({
      id: key,
      name: this.providers.get(key).name,
      available: true
    }));
  }
}

export default new AIService();