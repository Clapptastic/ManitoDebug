# API Documentation

## Overview

This document provides comprehensive API documentation for the platform, including authentication, team collaboration, competitor analysis, and administrative functions.

## Authentication

All API endpoints require authentication unless explicitly marked as public. The platform uses Supabase Auth with JWT tokens.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Team Collaboration API

### Teams

#### Create Team
```http
POST /api/teams
```

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "subscription_tier": "string (optional, default: 'free')"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "owner_id": "uuid",
  "subscription_tier": "string",
  "settings": {},
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

#### Get User Teams
```http
GET /api/teams
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "string",
    "description": "string",
    "owner_id": "uuid",
    "subscription_tier": "string",
    "settings": {},
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Get Team Details
```http
GET /api/teams/{team_id}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "string",
  "description": "string",
  "owner_id": "uuid",
  "subscription_tier": "string",
  "settings": {},
  "created_at": "timestamp",
  "updated_at": "timestamp"
}
```

### Team Members

#### Get Team Members
```http
GET /api/teams/{team_id}/members
```

**Response:**
```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "user_id": "uuid",
    "role": "string",
    "status": "string",
    "permissions": [],
    "joined_at": "timestamp",
    "invited_at": "timestamp"
  }
]
```

#### Invite Team Member
```http
POST /api/teams/{team_id}/members/invite
```

**Request Body:**
```json
{
  "email": "string (required)",
  "role": "string (optional, default: 'member')"
}
```

**Response:**
```json
{
  "id": "uuid",
  "team_id": "uuid",
  "email": "string",
  "role": "string",
  "token": "string",
  "invited_by": "uuid",
  "expires_at": "timestamp",
  "created_at": "timestamp"
}
```

#### Update Member Role
```http
PUT /api/teams/{team_id}/members/{user_id}
```

**Request Body:**
```json
{
  "role": "string (required)",
  "permissions": ["string"] (optional)
}
```

#### Remove Team Member
```http
DELETE /api/teams/{team_id}/members/{user_id}
```

### Team Invitations

#### Get User Invitations
```http
GET /api/invitations
```

**Response:**
```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "email": "string",
    "role": "string",
    "token": "string",
    "invited_by": "uuid",
    "expires_at": "timestamp",
    "accepted_at": "timestamp",
    "created_at": "timestamp"
  }
]
```

#### Accept Invitation
```http
POST /api/invitations/{token}/accept
```

**Response:**
```json
{
  "success": true,
  "team_id": "uuid",
  "message": "string"
}
```

### Shared Workspaces

#### Get Team Workspaces
```http
GET /api/teams/{team_id}/workspaces
```

**Response:**
```json
[
  {
    "id": "uuid",
    "team_id": "uuid",
    "name": "string",
    "description": "string",
    "created_by": "uuid",
    "settings": {},
    "created_at": "timestamp",
    "updated_at": "timestamp"
  }
]
```

#### Create Workspace
```http
POST /api/teams/{team_id}/workspaces
```

**Request Body:**
```json
{
  "name": "string (required)",
  "description": "string (optional)",
  "settings": {} (optional)
}
```

## Competitor Analysis API

### Analyses

#### Create Analysis
```http
POST /api/competitor-analysis
```

**Request Body:**
```json
{
  "company_name": "string (required)",
  "company_url": "string (optional)",
  "analysis_type": "string (optional)"
}
```

#### Get User Analyses
```http
GET /api/competitor-analysis
```

**Query Parameters:**
- `limit`: Number of results (default: 50)
- `offset`: Pagination offset (default: 0)
- `status`: Filter by status

#### Get Analysis Details
```http
GET /api/competitor-analysis/{analysis_id}
```

#### Update Analysis
```http
PUT /api/competitor-analysis/{analysis_id}
```

#### Delete Analysis
```http
DELETE /api/competitor-analysis/{analysis_id}
```

## API Keys Management

### User API Keys

#### Get User API Keys
```http
GET /api/api-keys
```

#### Create API Key
```http
POST /api/api-keys
```

**Request Body:**
```json
{
  "name": "string (required)",
  "provider": "string (required)",
  "api_key": "string (required)",
  "permissions": ["string"] (optional)
}
```

#### Update API Key
```http
PUT /api/api-keys/{key_id}
```

#### Delete API Key
```http
DELETE /api/api-keys/{key_id}
```

## Administrative API

### User Management

#### Get Users (Admin Only)
```http
GET /api/admin/users
```

#### Get User Details (Admin Only)
```http
GET /api/admin/users/{user_id}
```

#### Update User (Admin Only)
```http
PUT /api/admin/users/{user_id}
```

### System Monitoring

#### Get System Health
```http
GET /api/admin/health
```

#### Get API Metrics (Admin Only)
```http
GET /api/admin/metrics
```

#### Get Audit Logs (Admin Only)
```http
GET /api/admin/audit-logs
```

## Error Handling

### Standard Error Response
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### Common Error Codes
- `401`: Unauthorized - Invalid or missing authentication
- `403`: Forbidden - Insufficient permissions
- `404`: Not Found - Resource does not exist
- `422`: Unprocessable Entity - Validation errors
- `429`: Too Many Requests - Rate limit exceeded
- `500`: Internal Server Error - Server-side error

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- **General endpoints**: 100 requests per minute per user
- **Analysis endpoints**: 10 requests per minute per user
- **Admin endpoints**: 50 requests per minute per admin

## Webhooks

### Team Events
- `team.created`
- `team.updated`
- `team.deleted`
- `team.member.invited`
- `team.member.joined`
- `team.member.removed`

### Analysis Events
- `analysis.created`
- `analysis.completed`
- `analysis.failed`
- `analysis.updated`

## SDK Examples

### JavaScript/TypeScript
```typescript
import { supabase } from '@/integrations/supabase/client';

// Create team
const { data: team, error } = await supabase
  .from('teams')
  .insert({
    name: 'My Team',
    description: 'Team description'
  })
  .select()
  .single();

// Get team members
const { data: members, error } = await supabase
  .from('team_members')
  .select('*')
  .eq('team_id', teamId)
  .eq('status', 'active');
```

## Versioning

The API uses semantic versioning. Current version: `v1`

- **URL Format**: `/api/v1/endpoint`
- **Breaking changes**: Will increment major version
- **New features**: Will increment minor version
- **Bug fixes**: Will increment patch version

## Support

For API support and questions:
- Documentation: [Internal Wiki]
- Issues: Create tickets in project management system
- Emergency: Contact development team directly