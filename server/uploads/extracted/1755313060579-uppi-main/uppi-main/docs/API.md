# API Documentation

## Overview

This document covers the API endpoints and integration patterns used throughout the platform, with special focus on the recently optimized admin functionality.

## Authentication

All API requests require authentication through Supabase Auth. The platform uses JWT tokens for session management.

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Admin API Endpoints

### System Health

#### GET /admin/system-health
Returns current system health metrics and component status.

**Response:**
```json
{
  "overall_status": "operational",
  "components": [
    {
      "id": "api-gateway",
      "name": "API Gateway",
      "status": "operational",
      "response_time": 45,
      "uptime_percentage": 99.9
    }
  ],
  "system_metrics": {
    "cpu_usage": 45.2,
    "memory_usage": 67.8,
    "disk_usage": 34.5,
    "network_latency": 23,
    "active_connections": 156,
    "error_rate": 0.1,
    "uptime": 99.9
  }
}
```

### User Management

#### GET /admin/users
Retrieve all platform users (Admin access required).

#### PUT /admin/users/:id/role
Update user role (Super Admin access required).

**Request Body:**
```json
{
  "role": "admin" | "super_admin" | "user"
}
```

### Analytics

#### GET /admin/analytics
Get platform analytics data.

**Query Parameters:**
- `timeRange`: "7d" | "30d" | "90d" (default: "30d")

### Package Dependencies

#### GET /admin/packages
Get package dependency information and security status.

## Edge Functions

The platform uses Supabase Edge Functions for serverless processing:

### Available Functions

1. **get-schemas** - Database schema introspection
2. **admin-operations** - Administrative operations
3. **api-cost-tracking** - AI API usage monitoring

### Function Invocation

```typescript
const { data, error } = await supabase.functions.invoke('function-name', {
  body: { ...params }
});
```

## Database API (Supabase)

### Direct Database Access

The platform uses Supabase's auto-generated REST API for database operations:

```typescript
// Example: Fetch system components
const { data, error } = await supabase
  .from('system_components')
  .select('*')
  .order('name');
```

### Real-time Subscriptions

```typescript
// Subscribe to system metric changes
const subscription = supabase
  .channel('system-metrics')
  .on('postgres_changes', 
    { event: '*', schema: 'public', table: 'system_metrics' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
```

## Error Handling

### Standard Error Response

```json
{
  "error": {
    "code": "PERMISSION_DENIED",
    "message": "Insufficient permissions",
    "details": {
      "required_role": "admin",
      "user_role": "user"
    }
  }
}
```

### Common Error Codes

- `PERMISSION_DENIED` - Insufficient user permissions
- `VALIDATION_ERROR` - Request validation failed
- `NOT_FOUND` - Resource not found
- `RATE_LIMIT_EXCEEDED` - Too many requests
- `INTERNAL_ERROR` - Server-side error

## Rate Limiting

API endpoints are rate-limited based on user role:

- **User**: 100 requests/minute
- **Admin**: 1000 requests/minute
- **Super Admin**: 5000 requests/minute

## Data Types

### User Role Enum
```typescript
enum UserRole {
  USER = 'user',
  ADMIN = 'admin', 
  SUPER_ADMIN = 'super_admin'
}
```

### System Component Status
```typescript
enum ComponentStatus {
  OPERATIONAL = 'operational',
  DEGRADED = 'degraded',
  OUTAGE = 'outage'
}
```

## Integration Examples

### Admin Service Integration

```typescript
import { adminService } from '@/services/adminService';

// Get system health
const health = await adminService.fetchSystemHealth();

// Update user role
await adminService.updateUserRole(userId, 'admin');

// Get analytics
const analytics = await adminService.getAnalytics('30d');
```

### Error Handling Pattern

```typescript
try {
  const result = await apiCall();
  return result;
} catch (error) {
  if (error.code === 'PERMISSION_DENIED') {
    // Handle permission error
  } else if (error.code === 'RATE_LIMIT_EXCEEDED') {
    // Handle rate limit
  } else {
    // Handle generic error
  }
  throw error;
}
```

## Security Considerations

1. **Authentication**: All endpoints require valid JWT
2. **Authorization**: Role-based access control enforced
3. **Data Validation**: Input validation on all endpoints
4. **Rate Limiting**: Prevents abuse and DoS attacks
5. **Audit Logging**: All admin actions are logged

## Performance Optimization

### Caching Strategy

- **User Roles**: Cached for 5 minutes
- **System Metrics**: Cached for 1 minute
- **Analytics Data**: Cached for 15 minutes

### Database Optimization

- Indexed columns for common queries
- Row Level Security for data isolation
- Connection pooling for performance

---

*For more details, see the [Admin Dashboard Documentation](ADMIN_DASHBOARD.md)*