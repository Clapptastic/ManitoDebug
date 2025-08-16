# AI Service

The AI Service provides intelligent code analysis and insights through multiple AI providers.

## Features

- **Multiple AI Providers**: Support for OpenAI GPT, Anthropic Claude, and Local AI
- **Context-Aware Analysis**: Leverages scan results for targeted insights
- **Intelligent Prompts**: Specialized prompts for code analysis tasks
- **Fallback Support**: Graceful degradation to local AI when external providers unavailable

## Configuration

Configure AI providers through environment variables:

### OpenAI (GPT)
```env
OPENAI_API_KEY=your-openai-api-key-here
OPENAI_MODEL=gpt-3.5-turbo  # or gpt-4, gpt-4-turbo
```

### Anthropic (Claude)
```env
ANTHROPIC_API_KEY=your-anthropic-api-key-here
ANTHROPIC_MODEL=claude-3-haiku-20240307  # or claude-3-sonnet-20240229
```

## Usage

### Basic Usage
```javascript
import aiService from './services/ai.js';

// Send a message with local AI
const response = await aiService.sendMessage(
  "How can I improve my code quality?", 
  null, 
  'local'
);
```

### With Context (Recommended)
```javascript
// Send message with scan context for better insights
const response = await aiService.sendMessage(
  "What are the main issues in my codebase?",
  {
    files: [
      { filePath: 'src/App.js', lines: 250, complexity: 6 },
      { filePath: 'src/utils.js', lines: 180, complexity: 3 }
    ],
    conflicts: [
      { type: 'circular_dependency', message: 'Circular dependency found' }
    ]
  },
  'openai'
);
```

## Response Format

```javascript
{
  id: 'ai_1234567890',
  provider: 'openai',
  response: 'Detailed AI analysis response...',
  suggestions: [
    'Specific actionable suggestion 1',
    'Specific actionable suggestion 2'
  ],
  confidence: 0.85,
  timestamp: '2024-01-01T12:00:00.000Z',
  model: 'gpt-3.5-turbo'
}
```

## Provider Details

### Local AI
- **Always Available**: No API keys required
- **Context-Aware**: Provides intelligent insights based on scan data
- **Fast**: Quick responses with simulated processing time
- **Educational**: Great for understanding AI integration patterns

### OpenAI GPT
- **Powerful**: Advanced reasoning and code understanding
- **Accurate**: High-quality analysis and suggestions
- **Cost**: Paid API usage
- **Setup**: Requires OpenAI API key

### Anthropic Claude
- **Thoughtful**: Excellent at explaining complex concepts
- **Safe**: Built-in safety features
- **Cost**: Paid API usage
- **Setup**: Requires Anthropic API key

## API Endpoints

### Get Available Providers
```
GET /api/ai/providers
```

### Send AI Request
```
POST /api/ai/send
Content-Type: application/json

{
  "message": "Your question here",
  "context": { /* scan results */ },
  "provider": "local|openai|claude"
}
```

## Examples

### Code Quality Analysis
```javascript
const response = await aiService.sendMessage(
  "Review my code quality and suggest improvements",
  scanResults,
  'openai'
);
```

### Security Review
```javascript
const response = await aiService.sendMessage(
  "Are there any security vulnerabilities in this code?",
  scanResults,
  'claude'
);
```

### Performance Analysis
```javascript
const response = await aiService.sendMessage(
  "How can I optimize the performance of my application?",
  scanResults,
  'local'
);
```

## Error Handling

The service includes comprehensive error handling:

- **Provider Unavailable**: Falls back to error messages with guidance
- **Invalid Input**: Validates message format and requirements
- **API Failures**: Returns meaningful error messages
- **Rate Limiting**: Handles API rate limits gracefully

## Development

### Adding New Providers

1. Add provider configuration in the constructor
2. Implement a handler method (e.g., `handleNewProvider`)
3. Add environment variable documentation
4. Update the `getAvailableProviders` method

### Testing

```bash
# Test with curl
curl -X POST http://localhost:3000/api/ai/send \
  -H "Content-Type: application/json" \
  -d '{"message": "Test message", "provider": "local"}'
```

## Security Notes

- **API Keys**: Keep API keys secure and never commit them to version control
- **Rate Limits**: Be aware of provider rate limits and costs
- **Input Validation**: All inputs are validated before processing
- **Error Messages**: Sensitive information is not exposed in error messages