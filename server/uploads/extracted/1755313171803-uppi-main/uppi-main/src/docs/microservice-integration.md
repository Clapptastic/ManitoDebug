
# Microservice Integration Guide

## Overview

This document provides a comprehensive guide to integrating microservices with the platform. The platform uses a registry-based approach to discover and manage microservices, making it easy to add new services with minimal code changes.

## Architecture

The microservice architecture consists of:

1. **Microservice Registry**: Central registry that maintains information about all available microservices
2. **Microservice Client**: Standardized client for making requests to microservices
3. **Microservice Configuration**: Type-safe configuration definitions for each service
4. **Integration Hooks**: React hooks for consuming microservices in components

## Integration Workflow

### 1. Register a Microservice

To integrate a new microservice:

1. Create a microservice configuration object:
   ```typescript
   const myServiceConfig: MicroserviceConfig = {
     id: 'my-service',
     name: 'My Service',
     description: 'Description of my service',
     version: '1.0.0',
     baseUrl: 'https://api.example.com/v1',
     apiKey: '...',  // Optional if the service requires authentication
     endpoints: [
       {
         path: '/users',
         method: 'GET',
         description: 'Get all users',
         requiresAuth: true,
         isPublic: false
       },
       // Additional endpoints...
     ],
     isActive: true,
     isExternal: true,
     healthCheckPath: '/health',
     documentation: {
       swaggerUrl: 'https://api.example.com/swagger',
       readmeUrl: 'https://api.example.com/docs'
     }
   };
   ```

2. Use the Admin UI to register the microservice:
   - Navigate to Admin → Microservices
   - Click "Add Microservice"
   - Enter the required configuration

3. Alternatively, use the API directly:
   ```typescript
   import { microserviceRegistry } from '@/services/microservices/registry';
   
   await microserviceRegistry.registerService(myServiceConfig);
   ```

### 2. Use the Microservice in Components

```typescript
import { useMicroserviceClient } from '@/hooks/useMicroserviceClient';

function MyComponent() {
  const { client, isAvailable } = useMicroserviceClient('my-service');
  
  const fetchData = async () => {
    if (isAvailable && client) {
      try {
        const response = await client.request('/users', 'GET');
        console.log(response.data);
      } catch (error) {
        console.error('Error calling microservice:', error);
      }
    }
  };
  
  // Rest of component...
}
```

## Microservice Types

### MicroserviceConfig

The primary configuration interface for a microservice:

```typescript
interface MicroserviceConfig {
  id: string;                    // Unique identifier
  name: string;                  // Display name
  description: string;           // Service description
  version: string;               // API version
  baseUrl: string;               // Base URL for the service
  apiKey?: string;               // Optional API key
  endpoints: MicroserviceEndpoint[]; // Defined endpoints
  isActive: boolean;             // Whether service is available
  isExternal: boolean;           // Whether managed externally
  healthCheckPath?: string;      // Health check endpoint
  documentation?: {              // Documentation links
    swaggerUrl?: string;
    readmeUrl?: string;
  };
}
```

### MicroserviceEndpoint

Configuration for individual service endpoints:

```typescript
interface MicroserviceEndpoint {
  path: string;                // Endpoint path
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'; // HTTP method
  description: string;         // Description
  requiresAuth: boolean;       // Requires authentication
  isPublic: boolean;           // Publicly accessible
  parameters?: EndpointParameter[]; // Parameters
  responseSchema?: any;        // Response schema
}
```

## Microservice Registry

The registry provides the following key methods:

- `initialize()`: Load all registered microservices
- `getService(serviceId)`: Retrieve a specific service configuration
- `getAllServices()`: Get all registered services
- `getActiveServices()`: Get only active services
- `registerService(config)`: Register a new service
- `updateService(id, config)`: Update an existing service
- `removeService(id)`: Remove a service

## Microservice Client

The client handles all communication with microservices:

```typescript
const client = createMicroserviceClient({
  baseUrl: 'https://api.example.com',
  apiKey: 'your-api-key',
  timeout: 30000,
  retryConfig: {
    maxRetries: 3,
    initialDelay: 1000,
    maxDelay: 10000
  }
});

// Make a request
const response = await client.request('/endpoint', 'GET', { params });
```

## Error Handling

The microservice client includes built-in error handling:

- Automatic retry for transient failures
- Timeout handling
- Error normalization

All errors follow a standard format:

```typescript
interface MicroserviceError {
  code: string;
  message: string;
  details?: any;
}
```

## Best Practices

1. **Versioning**: Always include version information in the service configuration
2. **Health Checks**: Implement a health check endpoint for each service
3. **Documentation**: Provide Swagger/OpenAPI documentation for each service
4. **Authentication**: Use API keys for service-to-service communication
5. **Error Handling**: Implement consistent error responses and handling
6. **Monitoring**: Log all microservice interactions for debugging
7. **Caching**: Implement appropriate caching strategies for responses

## Example Implementation

See the Admin Microservices page for a complete implementation of the microservice management UI.

## Troubleshooting

Common issues and their solutions:

- **Service Unavailable**: Check isActive status and health check endpoint
- **Authentication Errors**: Verify API key configuration
- **Timeout Errors**: Increase timeout or check service performance
- **Invalid Responses**: Validate against response schema
