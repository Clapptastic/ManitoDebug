
# Competitor Analysis Documentation

The Competitor Analysis feature provides a comprehensive toolkit for analyzing and understanding competitors in the market. This document outlines the capabilities, data structure, and usage guidelines for the feature.

## Overview

The Competitor Analysis feature allows users to:

1. Analyze competitors using AI-powered tools
2. View detailed information about competitors
3. Compare multiple competitors
4. Track market positioning and trends
5. Save and manage analyses for future reference

## Data Structure

Each competitor analysis contains the following key data components:

### Core Data
- **Basic Information**: Name, business model, growth stage, position type
- **Value Proposition**: Core value offered to customers
- **Market Metrics**: Market share, presence score, growth rates

### Company Information
- **Company Overview**: Founded date, headquarters, employee count, leadership, funding info
- **Industry Classification**: Primary and secondary industries

### Market Analysis
- **Market Position**: Competitive position, market share, target audience
- **Market Indicators**: Market saturation, entry barriers, growth potential
- **Performance Metrics**: Revenue growth, market share growth, customer satisfaction

### Strategic Analysis
- **SWOT Analysis**: Strengths, weaknesses, opportunities, threats
- **Product Offerings**: Product features, pricing models, USPs
- **Marketing Strategy**: Target segments, positioning, messaging
- **Distribution Channels**: Sales channels, partnerships, effectiveness

### Trend Analysis
- **Industry Trends**: Emerging patterns, disruptions, regulations
- **Market Trends**: Customer behavior, demand shifts, pricing trends

### Technical Details
- **API Sources**: Which AI services contributed to the analysis
- **Data Quality Metrics**: Completeness, consistency, accuracy, relevance
- **Metadata**: Creation dates, update timestamps, confidence scores

## Types and Interfaces

The system uses a comprehensive type system for competitor analysis:

### CompetitorData
The main interface for competitor information with these key properties:
- `id`: Unique identifier
- `name`: Competitor name
- `competitor_name`: Name (for compatibility)
- `strengths`, `weaknesses`, `opportunities`, `threats`: SWOT analysis items
- `market_share`, `market_presence_score`, `data_quality_score`: Metrics
- Company details: `company_url`, `headquarters`, `employee_count`, etc.
- Additional metadata: `description`, `website`, `location`, `founded_year`, etc.

### SwotItem
Structure for SWOT analysis items:
- `id`: Unique identifier
- `content`: Main content of the item
- `impact`: Impact level (HIGH, MEDIUM, LOW)
- `text`: Legacy field for backward compatibility with tests

### Impact Levels
Enum `ImpactLevel` with values:
- `LOW` - Minor impact on business
- `MEDIUM` - Moderate impact on business
- `HIGH` - Significant impact on business

### API Integration
- `ApiProviderStatusInfo`: Status information about API providers
- `ApiStatus`: Status of an API key/connection

## User Interface Components

### Competitor Details View

The Competitor Details page displays all information collected about a competitor in an organized, tabbed interface:

1. **Overview Tab**: General company information, founding details, funding
2. **Product Tab**: Product offerings, features, pricing, technology stack
3. **Market Tab**: Market position, target audience, market metrics
4. **SWOT Tab**: Comprehensive SWOT analysis with impact levels
5. **Strategy Tab**: Marketing strategies, positioning, messaging
6. **Trends Tab**: Industry and market trends affecting the competitor
7. **Notes Tab**: User-added notes and annotations
8. **Compare Tab**: Side-by-side comparison with similar competitors
9. **Raw Data Tab**: Access to all raw data collected by AI services

### API Integration

The Competitor Analysis feature leverages multiple AI services:

- **OpenAI**: Primary analysis engine
- **Anthropic**: Secondary analysis for verification
- **Perplexity**: Web search and real-time data
- **Google**: Additional data sources

Each analysis tracks which services contributed data and their confidence scores.

## API Functions

The system provides several key API functions:

### getCompetitorAnalysis(id: string)
- Fetches a specific competitor analysis by ID
- Returns normalized CompetitorData

### getApiKeys()
- Retrieves all API keys for the current user
- Used for checking API availability

### saveApiKey(keyType: ApiKeyTypeEnum, apiKey: string)
- Saves or updates an API key
- Masks the key for security

### validateApiKey(keyType: ApiKeyTypeEnum)
- Checks if an API key is valid and working
- Returns status information

## Utility Functions

Helper functions for rendering and processing data:

### normalizeCompetitorData(data: any)
- Converts raw data to CompetitorData format
- Ensures all required fields have default values

### safeRenderValue(value: any, fallback = 'N/A')
- Safely renders values with fallbacks for null/undefined

### formatDate(dateString: string, options)
- Formats dates to human-readable format

## Best Practices

For optimal use of the Competitor Analysis feature:

1. **Regular Updates**: Refresh analyses quarterly or when market conditions change
2. **Multiple Sources**: Enable multiple AI providers for higher accuracy
3. **Data Validation**: Verify key metrics with external sources
4. **Comparative Analysis**: Analyze multiple competitors in the same segment
5. **Note-Taking**: Document insights and observations in the Notes tab

## Future Enhancements

Planned improvements to the Competitor Analysis feature:

1. Time-series tracking of metrics
2. Export to PDF/CSV functionality
3. AI-generated summaries and recommendations
4. Integration with market size estimation
5. Custom dashboards and visualization tools

## Feedback and Support

We continuously improve the Competitor Analysis feature based on user feedback. Please report issues or suggestions through the support channels.
