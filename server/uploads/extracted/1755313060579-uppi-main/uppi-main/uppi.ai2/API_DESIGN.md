
# API Design Document

## Overview

This document outlines the API design principles, endpoint specifications, and integration patterns for Uppi.ai 2.0. The API layer serves as the interface between the frontend application and backend services, including Supabase and third-party AI providers.

## API Design Principles

1. **REST-based Architecture**: Follow RESTful principles for resource-oriented endpoints
2. **Consistent Response Format**: Standardized response structure across all endpoints
3. **Versioned Endpoints**: API versioning to support backward compatibility
4. **Proper HTTP Status Codes**: Appropriate status codes for different response types
5. **Comprehensive Error Handling**: Detailed error messages and codes
6. **Authentication Required**: JWT-based authentication for all non-public endpoints
7. **Rate Limiting**: Protect against abuse and ensure fair usage

## Authentication

All protected API endpoints require authentication via:

```
Authorization: Bearer {jwt_token}
```

### Authentication Flow

1. User signs in via Supabase Auth
2. JWT token is returned and stored securely
3. Token is included in all subsequent API requests
4. Token refresh mechanism handles expiration

## Standard Response Format

```json
{
  "data": {}, // Response data (null if error)
  "error": null, // Error details (null if success)
  "status": 200, // HTTP status code
  "timestamp": "2023-06-15T12:34:56Z"
}
```

## Error Response Format

```json
{
  "data": null,
  "error": {
    "code": "resource_not_found",
    "message": "The requested resource was not found",
    "details": {} // Additional error details
  },
  "status": 404,
  "timestamp": "2023-06-15T12:34:56Z"
}
```

## API Endpoints

### User Management

#### GET /api/v1/user/profile
Retrieve current user profile

**Response**:
```json
{
  "data": {
    "id": "user-uuid",
    "email": "user@example.com",
    "full_name": "John Doe",
    "avatar_url": "https://example.com/avatar.jpg",
    "created_at": "2023-01-01T00:00:00Z",
    "updated_at": "2023-01-01T00:00:00Z"
  },
  "error": null,
  "status": 200,
  "timestamp": "2023-06-15T12:34:56Z"
}
```

#### PUT /api/v1/user/profile
Update user profile

**Request**:
```json
{
  "full_name": "Updated Name",
  "avatar_url": "https://example.com/new-avatar.jpg"
}
```

### API Key Management

#### GET /api/v1/api-keys
List all API keys for current user

**Response**:
```json
{
  "data": [
    {
      "id": "key-uuid",
      "api_type": "openai",
      "status": "valid",
      "last_validated": "2023-06-15T10:30:00Z",
      "created_at": "2023-06-01T00:00:00Z"
    }
  ],
  "error": null,
  "status": 200,
  "timestamp": "2023-06-15T12:34:56Z"
}
```

#### POST /api/v1/api-keys
Add new API key

**Request**:
```json
{
  "api_type": "anthropic",
  "api_key": "sk-ant-api03857..."
}
```

#### DELETE /api/v1/api-keys/{id}
Delete API key

### Competitor Analysis

#### GET /api/v1/competitor-analysis
List all competitor analyses

**Query Parameters**:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `status`: Filter by status (optional)

**Response**:
```json
{
  "data": {
    "items": [
      {
        "id": "analysis-uuid",
        "name": "SaaS Competitors Analysis",
        "status": "completed",
        "created_at": "2023-06-01T00:00:00Z",
        "updated_at": "2023-06-15T10:30:00Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 45,
      "total_pages": 3
    }
  },
  "error": null,
  "status": 200,
  "timestamp": "2023-06-15T12:34:56Z"
}
```

#### GET /api/v1/competitor-analysis/{id}
Get detailed competitor analysis

**Response**:
```json
{
  "data": {
    "id": "analysis-uuid",
    "name": "SaaS Competitors Analysis",
    "description": "Analysis of key SaaS competitors",
    "status": "completed",
    "settings": {
      "api_providers": ["openai", "anthropic"],
      "depth_level": "comprehensive",
      "include_market_data": true
    },
    "competitors": [
      {
        "id": "competitor-uuid",
        "name": "Competitor A",
        "website": "https://competitora.com",
        "strengths": ["Great UX", "Strong market position"],
        "weaknesses": ["High price point", "Limited integrations"]
      }
    ],
    "created_at": "2023-06-01T00:00:00Z",
    "updated_at": "2023-06-15T10:30:00Z"
  },
  "error": null,
  "status": 200,
  "timestamp": "2023-06-15T12:34:56Z"
}
```

#### POST /api/v1/competitor-analysis
Create new competitor analysis

**Request**:
```json
{
  "name": "New Competitor Analysis",
  "description": "Analysis of competitors in fintech space",
  "settings": {
    "api_providers": ["openai", "perplexity"],
    "depth_level": "standard",
    "include_market_data": true
  },
  "competitors": [
    {
      "name": "Competitor A",
      "website": "https://competitora.com"
    }
  ]
}
```

#### PUT /api/v1/competitor-analysis/{id}
Update competitor analysis

#### POST /api/v1/competitor-analysis/{id}/analyze
Run or update analysis on existing competitor analysis

**Request**:
```json
{
  "api_providers": ["openai", "anthropic"],
  "competitors": ["competitor-uuid-1", "competitor-uuid-2"]
}
```

### Market Size Analysis

#### GET /api/v1/market-size
List all market size analyses

#### GET /api/v1/market-size/{id}
Get detailed market size analysis

#### POST /api/v1/market-size
Create new market size analysis

### Document Management

#### GET /api/v1/documents
List all documents

#### GET /api/v1/documents/{id}
Get document details

#### POST /api/v1/documents
Upload new document

**Request** (multipart/form-data):
- `name`: Document name
- `description`: Document description (optional)
- `file`: File to upload
- `tags`: Array of tags (optional)

#### DELETE /api/v1/documents/{id}
Delete document

## Edge Function Endpoints

### AI Processing

#### POST /api/v1/ai/analyze-competitor
Process competitor data with AI

**Request**:
```json
{
  "competitor_name": "Competitor A",
  "website": "https://competitora.com",
  "description": "Optional description",
  "api_providers": ["openai", "anthropic"]
}
```

#### POST /api/v1/ai/analyze-market-trends
Analyze market trends with AI

**Request**:
```json
{
  "industry": "SaaS",
  "target_market": "Small Business",
  "timeframe": "2023-2025",
  "api_providers": ["openai", "perplexity"]
}
```

## Webhooks

### Webhook Format

```json
{
  "event": "analysis.completed",
  "data": {
    "id": "analysis-uuid",
    "status": "completed",
    "updated_at": "2023-06-15T10:30:00Z"
  },
  "timestamp": "2023-06-15T10:30:00Z"
}
```

### Available Webhooks

- `analysis.started`: Competitor analysis started
- `analysis.completed`: Competitor analysis completed
- `analysis.failed`: Competitor analysis failed
- `document.processed`: Document processing completed

## Rate Limiting

- Standard tier: 60 requests per minute
- Pro tier: 300 requests per minute
- Enterprise tier: Customizable limits

Rate limit headers included in all responses:
```
X-RateLimit-Limit: 60
X-RateLimit-Remaining: 58
X-RateLimit-Reset: 1623761700
```

## CORS Configuration

CORS is enabled for the frontend application domain with the following configuration:

```
Access-Control-Allow-Origin: https://app.uppi.ai
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Max-Age: 86400
```

## API Versioning Strategy

- Version included in URL path: `/api/v1/...`
- Major version bumps for breaking changes
- Support for previous API version for 6 months after new version release
