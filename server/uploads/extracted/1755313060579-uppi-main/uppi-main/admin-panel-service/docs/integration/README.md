# Admin Panel Service Integration Guide

## Overview

The Admin Panel Service can be integrated into any application in multiple ways:

1. **API Integration** - Connect via REST API
2. **Webhook Integration** - Receive real-time notifications
3. **Embedded Frontend** - Embed the admin UI in your application
4. **Microservice Architecture** - Run as a standalone service

## API Integration

### Client Library

```javascript
import { AdminPanelClient } from '@admin-panel-service/client';

const admin = new AdminPanelClient({
  baseUrl: 'https://admin.your-app.com',
  apiKey: 'your-api-key'
});
```

### Manual Integration

```javascript
// Using fetch
const response = await fetch('https://admin.your-app.com/api/health', {
  headers: {
    'Authorization': 'Bearer your-api-key',
    'Content-Type': 'application/json'
  }
});

const health = await response.json();
```

### Authentication

The service supports multiple authentication methods:

1. **API Keys** - For service-to-service communication
2. **JWT Tokens** - For user sessions
3. **OAuth2** - For third-party integrations

```javascript
// API Key authentication
const client = new AdminPanelClient({
  baseUrl: 'https://admin.your-app.com',
  apiKey: 'your-api-key'
});

// JWT authentication
const client = new AdminPanelClient({
  baseUrl: 'https://admin.your-app.com',
  token: 'jwt-token'
});
```

## Webhook Integration

### Setting up Webhooks

```javascript
// Create a webhook endpoint
await admin.createWebhook({
  url: 'https://your-app.com/webhooks/admin',
  events: ['user.created', 'user.updated', 'system.alert'],
  secret: 'webhook-secret'
});
```

### Handling Webhook Events

```javascript
app.post('/webhooks/admin', (req, res) => {
  const { event, data, timestamp } = req.body;
  
  // Verify webhook signature
  const signature = req.headers['x-admin-signature'];
  if (!verifySignature(req.body, signature, 'webhook-secret')) {
    return res.status(401).send('Invalid signature');
  }
  
  switch (event) {
    case 'user.created':
      handleUserCreated(data);
      break;
    case 'user.updated':
      handleUserUpdated(data);
      break;
    case 'system.alert':
      handleSystemAlert(data);
      break;
    default:
      console.log('Unknown event:', event);
  }
  
  res.status(200).send('OK');
});
```

### Event Types

| Event | Description | Data |
|-------|-------------|------|
| `user.created` | New user registered | `{ userId, email, role }` |
| `user.updated` | User profile updated | `{ userId, changes }` |
| `user.deleted` | User account deleted | `{ userId, email }` |
| `system.alert` | System health alert | `{ level, message, component }` |
| `api.error` | API error occurred | `{ endpoint, error, count }` |
| `security.breach` | Security incident | `{ type, severity, details }` |

## Embedded Frontend

### iframe Integration

```html
<!-- Simple iframe embed -->
<iframe 
  src="https://admin.your-app.com?embed=true" 
  width="100%" 
  height="600px"
  frameborder="0">
</iframe>
```

### React Component

```jsx
import { AdminPanel } from '@admin-panel-service/react';

function App() {
  return (
    <div>
      <h1>My Application</h1>
      <AdminPanel 
        apiUrl="https://admin.your-app.com"
        apiKey="your-api-key"
        theme="light"
        features={['users', 'analytics', 'health']}
      />
    </div>
  );
}
```

### Custom Styling

```css
/* Override admin panel styles */
.admin-panel {
  --primary-color: #your-brand-color;
  --background-color: #your-bg-color;
  --text-color: #your-text-color;
}
```

## Environment Configuration

### Development

```bash
# .env.development
ADMIN_PANEL_API_URL=http://localhost:3000/api
ADMIN_PANEL_SOCKET_URL=http://localhost:3000
ADMIN_PANEL_API_KEY=dev-api-key
```

### Production

```bash
# .env.production
ADMIN_PANEL_API_URL=https://admin.your-app.com/api
ADMIN_PANEL_SOCKET_URL=https://admin.your-app.com
ADMIN_PANEL_API_KEY=prod-api-key
```

## Real-time Updates

### WebSocket Connection

```javascript
import io from 'socket.io-client';

const socket = io('https://admin.your-app.com', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Join admin updates channel
socket.emit('join-admin');

// Listen for real-time updates
socket.on('user-activity', (data) => {
  console.log('User activity:', data);
});

socket.on('system-alert', (alert) => {
  console.log('System alert:', alert);
});
```

### Server-Sent Events

```javascript
const eventSource = new EventSource('https://admin.your-app.com/api/events');

eventSource.onmessage = (event) => {
  const data = JSON.parse(event.data);
  console.log('Admin event:', data);
};
```

## Security Considerations

### API Key Management

- Store API keys securely (environment variables, secret managers)
- Rotate keys regularly
- Use different keys for different environments
- Monitor API key usage

### Network Security

- Use HTTPS for all communications
- Implement rate limiting
- Validate all inputs
- Use CORS properly

### Data Privacy

- Encrypt sensitive data
- Implement data retention policies
- Support GDPR compliance
- Audit data access

## Monitoring Integration

### Prometheus Metrics

```javascript
// Custom metrics endpoint
app.get('/metrics', async (req, res) => {
  const adminMetrics = await admin.getMetrics();
  
  // Convert to Prometheus format
  const prometheusMetrics = convertToPrometheus(adminMetrics);
  
  res.set('Content-Type', 'text/plain');
  res.send(prometheusMetrics);
});
```

### Health Checks

```javascript
// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const adminHealth = await admin.getHealth();
    const overallHealth = {
      status: adminHealth.status === 'healthy' ? 'UP' : 'DOWN',
      components: {
        adminPanel: adminHealth
      }
    };
    
    res.json(overallHealth);
  } catch (error) {
    res.status(503).json({
      status: 'DOWN',
      error: error.message
    });
  }
});
```

## Error Handling

### API Errors

```javascript
try {
  const users = await admin.getUsers();
} catch (error) {
  if (error.response?.status === 401) {
    // Handle authentication error
    redirectToLogin();
  } else if (error.response?.status === 429) {
    // Handle rate limiting
    showRateLimitMessage();
  } else {
    // Handle other errors
    console.error('Admin API error:', error);
  }
}
```

### Retry Logic

```javascript
async function withRetry(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
}

// Usage
const users = await withRetry(() => admin.getUsers());
```

## Testing

### Mock Client

```javascript
// For testing
import { MockAdminClient } from '@admin-panel-service/client/mock';

const mockClient = new MockAdminClient();
mockClient.setMockData('users', [
  { id: '1', email: 'test@example.com', role: 'admin' }
]);

// Use in tests
const users = await mockClient.getUsers();
```

### Integration Tests

```javascript
describe('Admin Panel Integration', () => {
  let adminClient;
  
  beforeEach(() => {
    adminClient = new AdminPanelClient({
      baseUrl: 'http://localhost:3000/api',
      apiKey: 'test-api-key'
    });
  });
  
  it('should get system health', async () => {
    const health = await adminClient.getHealth();
    expect(health.status).toBe('healthy');
  });
  
  it('should handle authentication errors', async () => {
    const invalidClient = new AdminPanelClient({
      baseUrl: 'http://localhost:3000/api',
      apiKey: 'invalid-key'
    });
    
    await expect(invalidClient.getUsers()).rejects.toThrow('Unauthorized');
  });
});
```

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your domain is in the CORS_ORIGINS configuration
   - Check that credentials are included in requests

2. **Authentication Failures**
   - Verify API key is correct and not expired
   - Check that the user has necessary permissions

3. **Connection Timeouts**
   - Increase timeout configuration
   - Check network connectivity
   - Verify service is running and healthy

4. **Rate Limiting**
   - Implement exponential backoff
   - Cache responses when possible
   - Consider upgrading your plan

### Debug Mode

```javascript
const admin = new AdminPanelClient({
  baseUrl: 'https://admin.your-app.com',
  apiKey: 'your-api-key',
  debug: true // Enables detailed logging
});
```

### Health Check Script

```bash
#!/bin/bash
# health-check.sh

ADMIN_URL="https://admin.your-app.com"
API_KEY="your-api-key"

response=$(curl -s -w "%{http_code}" \
  -H "Authorization: Bearer $API_KEY" \
  "$ADMIN_URL/api/health")

if [ "$response" = "200" ]; then
  echo "Admin panel is healthy"
  exit 0
else
  echo "Admin panel is unhealthy: $response"
  exit 1
fi
```