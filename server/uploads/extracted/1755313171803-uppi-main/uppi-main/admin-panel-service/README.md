# Admin Panel Microservice

A standalone, containerized admin panel service that can be integrated into any application.

## Overview

This service provides a complete admin interface with the following features:
- User management and authentication
- System health monitoring
- API metrics and analytics
- Error logging and resolution
- Type coverage analysis
- Package management
- Database administration

## Architecture

```
admin-panel-service/
├── api/                 # Backend API service (Node.js/Express)
├── frontend/           # Standalone React admin UI
├── database/           # Database management (PostgreSQL)
├── docker/             # Docker configuration
├── docs/               # Documentation
├── tests/              # Test suites
└── config/             # Environment configurations
```

## Quick Start

### Development
```bash
# Start all services
docker-compose -f docker/docker-compose.dev.yml up

# Access admin panel
http://localhost:3001
```

### Production
```bash
# Build and deploy
docker-compose -f docker/docker-compose.prod.yml up -d

# Access admin panel
http://your-domain.com
```

## Integration

### API Client
```javascript
import { AdminPanelClient } from '@admin-panel-service/client';

const admin = new AdminPanelClient({
  baseUrl: 'https://admin.your-app.com',
  apiKey: 'your-api-key'
});

// Monitor system health
const health = await admin.getSystemHealth();

// Track user activities
await admin.logActivity(userId, activity);
```

### Webhook Integration
```javascript
// Receive real-time notifications
app.post('/webhooks/admin', (req, res) => {
  const { event, data } = req.body;
  
  switch (event) {
    case 'user.created':
      // Handle user creation
      break;
    case 'system.alert':
      // Handle system alerts
      break;
  }
});
```

## Documentation

- [API Documentation](./docs/api/README.md)
- [Integration Guide](./docs/integration/README.md)
- [Deployment Guide](./docs/deployment/README.md)
- [Configuration Reference](./docs/configuration/README.md)

## License

MIT License