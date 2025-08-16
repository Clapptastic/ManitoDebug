# Competitor Analysis Module Documentation

## Overview

The Competitor Analysis module provides a comprehensive toolset for analyzing competitors in the market. Using AI-powered analysis, it extracts insights about competitors' strengths, weaknesses, market position, and business strategies. The module integrates with various AI providers to deliver high-quality analysis results.

## Key Features

- Multi-API provider support (OpenAI, Anthropic, Gemini, Perplexity)
- Detailed analysis of competitor business models
- SWOT analysis (Strengths, Weaknesses, Opportunities, Threats)
- Market positioning and differentiation analysis
- Distribution channel analysis
- Competitive benchmarking
- Similar competitor identification
- Analysis saving and comparison

## Architecture

The module is structured with a clean separation of concerns:

1. **User Interface Layer**:
   - Input form for competitor names
   - API provider selection toggles
   - Progress indicators and status displays
   - Results visualization components

2. **Business Logic Layer**:
   - Analysis orchestration
   - API integration
   - Data normalization and processing
   - Storage management

3. **Data Storage Layer**:
   - Competitor analysis records
   - Analysis metadata
   - User preferences and settings

## Core Components

### CompetitorAnalysis

The main component that orchestrates the analysis process:

```tsx
<CompetitorAnalysis />
```

This component handles:
- User input for competitor names
- API provider selection
- Analysis initiation and progress tracking
- Results display

### Analysis Results

The results section displays the analyzed data in a user-friendly format:

```tsx
<AnalysisResults 
  results={competitorData}
  confidenceScores={confidenceScores}
/>
```

### API Provider Selection

Users can toggle between different AI providers:

```tsx
<ApiToggleSection 
  enabledApis={enabledApis}
  onToggle={handleToggle}
  apiStatuses={apiStatuses}
/>
```

## Data Flow

1. **Input**: User enters competitor names in the text area
2. **Configuration**: User selects which AI providers to use
3. **Analysis**: System calls Edge Functions to perform analysis
4. **Normalization**: Results are normalized into a consistent format
5. **Storage**: Analysis results are saved to the database
6. **Display**: Results are presented in a structured, visual format

## Type System

The module uses a robust type system to ensure data integrity:

### Enums

```typescript
// Analysis status
enum CompetitorStatusEnum {
  PENDING = 'pending',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  FAILED = 'failed',
  // ...
}

// Analysis steps for progress tracking
enum AnalysisStepEnum {
  INITIALIZING = 'initializing',
  VALIDATING_INPUT = 'validating-input',
  CONNECTING_API = 'connecting-api',
  // ...
}
```

### Data Structures

```typescript
// Core competitor data
interface CompetitorData {
  id: string;
  name: string;
  status: CompetitorStatusEnum;
  market_share?: number;
  market_presence_score?: number;
  strengths: string[];
  weaknesses: string[];
  // ... other properties
}

// Analysis record
interface CompetitorAnalysis {
  id: string;
  user_id: string;
  competitor_name: string;
  status: CompetitorStatusEnum;
  data: CompetitorData;
  // ... metadata and timestamps
}
```

## API Integration

The module integrates with multiple AI providers:

1. **OpenAI**: Performs detailed analysis using GPT models
2. **Anthropic**: Uses Claude models for nuanced market understanding
3. **Gemini**: Google's AI for technical and market analysis
4. **Perplexity**: Specialized in fact-based research and market intelligence

### Edge Functions

For security and performance, API calls are made through Supabase Edge Functions:

- `competitor-analysis`: Main analysis function (CONSOLIDATED)
- `validate-api-key`: Validates API keys before use

### API Status Monitoring

The system continuously monitors API availability and status:

```typescript
const { apiStatuses, refreshApiStatus } = useApiKeyStatus();
```

## Hooks and Services

The module provides several custom hooks and services:

### Hooks

- `useCompetitorAnalysisLogic`: Core analysis logic
- `useSavedAnalyses`: Managing saved analyses
- `useApiKeyStatus`: API key validation and status checking
- `useSimilarCompetitors`: Finding and comparing similar competitors

### Services

- `analyzeCompetitors`: Orchestrates the analysis process
- `saveAnalysis`: Persists analysis results
- `loadAnalysis`: Retrieves saved analyses
- `exportAnalysis`: Exports analysis in various formats

## Saving and Loading Analyses

Users can save analyses for future reference:

```typescript
// Save analysis
await saveAnalysis({
  competitor_name: "Competitor Name",
  data: competitorData,
  // ... other metadata
});

// Load saved analyses
const { savedItems, loading, error } = useSavedAnalyses();
```

## Similar Competitor Identification

The system can identify similar competitors to provide broader market context:

```typescript
const { similarCompetitors, isLoading } = useSimilarCompetitors(analysisId);
```

## Error Handling

The module implements comprehensive error handling:

1. **API Errors**: Handled through status monitoring and fallbacks
2. **Validation Errors**: Ensures input data meets requirements
3. **Processing Errors**: Gracefully handles errors during analysis
4. **UI Error Boundaries**: Prevents crashes with fallback UI

## Performance Considerations

- **API Cost Management**: Tracks and optimizes API usage costs
- **Caching**: Implements caching for expensive operations
- **Progressive Loading**: Shows partial results while analysis completes
- **Background Processing**: Handles long-running analyses asynchronously

## Customization

Users can customize the analysis process in several ways:

- Selecting which API providers to use
- Configuring analysis depth and focus areas
- Setting confidence thresholds for results
- Customizing the visualization of results

## Integration Points

The Competitor Analysis module integrates with other system components:

- **Market Research**: Uses analysis results for market sizing
- **Strategy Planning**: Informs strategy based on competitor positioning
- **Dashboard**: Surfaces key insights in dashboard widgets
- **Document Generation**: Creates reports from analysis data

## Best Practices

When working with the Competitor Analysis module:

1. **Start with quality inputs**: Provide accurate competitor names
2. **Use multiple API providers**: Combine for better results
3. **Save important analyses**: Keep a record of significant findings
4. **Compare over time**: Track how competitors evolve
5. **Export insights**: Share findings with stakeholders

## Troubleshooting

Common issues and solutions:

1. **Analysis fails**: Check API key validity and quotas
2. **Incomplete results**: Try different API providers
3. **Low confidence scores**: Provide more specific competitor names
4. **Slow performance**: Reduce the number of competitors analyzed at once
5. **Data discrepancies**: Compare results from different providers

## Future Enhancements

Planned improvements for the module:

1. **Time-based comparisons**: Track competitor evolution
2. **Industry-specific templates**: Tailored analysis for different sectors
3. **Custom analysis parameters**: User-defined analysis focus areas
4. **Data integration**: Import external data sources
5. **Collaborative analysis**: Team-based analysis workflows
