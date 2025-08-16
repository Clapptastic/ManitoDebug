
# Web Analytics Dashboard - Implementation Plan

## 🎯 Overview

This document outlines the implementation plan for a microservice-based Web Analytics Dashboard that tracks multiple websites and provides a unified view of metrics. The dashboard will be fully integrated with our SaaS platform using the existing microservice registry framework.

## 💼 Business Requirements

- Enable users to track analytics across multiple websites or applications
- Provide individual site analytics with detailed metrics
- Create a roll-up dashboard showing aggregated metrics across all tracked sites
- Allow easy configuration and management of tracked sites
- Support real-time or near-real-time analytics updates
- Make the system available under the Test → Measure → Learn section

## 🛠️ Technical Architecture

### Microservice Backend

#### Technology Stack

- **Runtime**: Node.js with Express or FastAPI with Python
- **Database**: PostgreSQL (leveraging existing Supabase integration)
- **Authentication**: JWT-based, integrated with existing auth system
- **Containerization**: Docker + docker-compose
- **Documentation**: OpenAPI/Swagger

#### Data Model

```
sites:
  - id: UUID (PK)
  - user_id: UUID (FK)
  - name: string
  - domain: string
  - tracking_id: string
  - created_at: timestamp
  - updated_at: timestamp
  - is_active: boolean

page_views:
  - id: UUID (PK)
  - site_id: UUID (FK)
  - page_path: string
  - timestamp: timestamp
  - visitor_id: string
  - session_id: string
  - referrer: string
  - device_type: string
  - browser: string
  - country: string
  - duration: number (seconds)
  - is_bounce: boolean

events:
  - id: UUID (PK)
  - site_id: UUID (FK)
  - page_path: string
  - event_name: string
  - event_category: string
  - timestamp: timestamp
  - visitor_id: string
  - session_id: string
  - properties: JSON
```

#### API Endpoints

1. **Health Check**
   - `GET /health` - Service health status

2. **Sites Management**
   - `GET /sites` - List all sites for user
   - `POST /sites` - Add a new site
   - `GET /sites/:site_id` - Get site details
   - `PUT /sites/:site_id` - Update site
   - `DELETE /sites/:site_id` - Remove site

3. **Analytics Data**
   - `GET /metrics/:site_id` - Get metrics for specific site
   - `GET /metrics/:site_id/pages` - Get top pages for site
   - `GET /metrics/:site_id/visitors` - Get visitor data for site
   - `GET /metrics/:site_id/events` - Get events for site
   - `GET /metrics/summary` - Get aggregated metrics across all sites

4. **Tracking Script**
   - `GET /tracking/:site_id.js` - Returns customized tracking script for site

#### Tracking Implementation

- JavaScript snippet that users add to their websites
- Sends data via API or websocket connection
- Handles common metrics: page views, events, session duration
- Respects privacy settings and consent requirements

### Frontend Dashboard

#### Technology Stack
- React with TypeScript (matching existing application)
- Tailwind CSS for styling (matching existing application)
- Recharts for data visualization
- Shadcn/UI for UI components

#### Key Components

1. **Site Management**
   - `AddSiteForm` - Form for adding new sites
   - `SitesList` - List of all tracked sites
   - `SiteConfigPanel` - Configuration options for each site

2. **Dashboard Views**
   - `AnalyticsDashboard` - Main dashboard container
   - `SiteSelector` - Dropdown/sidebar to select site or roll-up view
   - `MetricsOverview` - Summary KPI cards
   - `VisitorsChart` - Traffic visualization over time
   - `PagePerformanceTable` - Table of top-performing pages
   - `GeoDistributionMap` - Map showing visitor locations
   - `DeviceBreakdownChart` - Chart showing device/browser breakdown
   - `EventsTable` - Table of tracked events

#### User Flow

1. User navigates to Test → Measure → Learn → Analytics Dashboard
2. User can add a new site via "Add Site" button
3. User receives tracking code to add to their site
4. Dashboard starts displaying analytics as data comes in
5. User can toggle between individual sites or roll-up view

## 🔄 Integration with Existing System

### Microservice Registration

The analytics microservice will be registered using the existing microservice registry:

```typescript
const analyticsServiceConfig = {
  id: "analytics-service",
  service_id: "analytics-service",
  service_name: "Website Analytics",
  service_description: "Tracks and aggregates website metrics across multiple domains",
  base_url: "http://localhost:8800", // Replace with production URL
  health_check_path: "/health",
  swagger_url: "http://localhost:8800/docs",
  readme_url: "https://github.com/example/analytics-service",
  documentation: "Web analytics dashboard with roll-up reporting",
  version: "1.0.0",
  is_external: true,
  is_active: true,
  api_key: "", // Will be filled at runtime
  endpoints: [
    {
      id: "get-sites",
      microservice_id: "analytics-service",
      path: "/sites",
      method: "GET",
      description: "Get all tracked sites",
      parameters: {},
      response_schema: {},
      auth_required: true,
      requires_auth: true,
      is_public: false
    },
    {
      id: "add-site",
      microservice_id: "analytics-service",
      path: "/sites",
      method: "POST",
      description: "Add a new site to track",
      parameters: {
        required: ["name", "domain"],
        properties: {
          name: { type: "string" },
          domain: { type: "string" }
        }
      },
      response_schema: {},
      auth_required: true,
      requires_auth: true,
      is_public: false
    },
    {
      id: "get-site-metrics",
      microservice_id: "analytics-service",
      path: "/metrics/:site_id",
      method: "GET",
      description: "Fetch metrics for a single site",
      parameters: {
        required: ["site_id"],
        properties: {
          site_id: { type: "string" }
        }
      },
      response_schema: {},
      auth_required: true,
      requires_auth: true,
      is_public: false
    },
    {
      id: "get-dashboard-summary",
      microservice_id: "analytics-service",
      path: "/metrics/summary",
      method: "GET",
      description: "Roll-up summary across all sites",
      parameters: {},
      response_schema: {},
      auth_required: true,
      requires_auth: true,
      is_public: false
    },
    {
      id: "get-tracking-script",
      microservice_id: "analytics-service",
      path: "/tracking/:site_id.js",
      method: "GET",
      description: "Get site-specific tracking script",
      parameters: {
        required: ["site_id"],
        properties: {
          site_id: { type: "string" }
        }
      },
      response_schema: {},
      auth_required: false,
      requires_auth: false,
      is_public: true
    }
  ]
};
```

### Authentication Integration

- Uses existing JWT authentication system
- Microservice validates tokens against Supabase auth
- User permissions maintained through existing roles

### Database Integration

- Use Supabase for data storage via RLS policies
- Create analytics-specific tables in the existing database
- Ensure proper indexing for performance

## 🔧 Development Process

### Phase 1: Setup & Basic Infrastructure

1. Create Docker environment and service skeleton
2. Set up database schema and migrations
3. Implement health check endpoint
4. Register microservice with the platform

### Phase 2: Core Functionality

1. Implement site management APIs
2. Create tracking script generator
3. Build data ingestion endpoints
4. Develop basic metrics calculations

### Phase 3: Frontend Development

1. Create site management UI
2. Build dashboard components
3. Implement charts and data visualizations
4. Add site selector and roll-up view

### Phase 4: Integration & Polish

1. Integrate with navigation and routing
2. Add real-time updates with WebSockets
3. Implement error handling and fallbacks
4. Optimize performance and loading states

## 🧪 Testing Strategy

- **Unit Tests**: For individual components and functions
- **Integration Tests**: For API endpoints and data flow
- **E2E Tests**: For complete user journeys
- **Performance Tests**: For data processing under load
- **Security Tests**: For authentication and data protection

## 🚀 Deployment Strategy

### Local Development

```yaml
# docker-compose.yml
version: '3'
services:
  analytics-service:
    build: .
    ports:
      - "8800:8800"
    environment:
      - NODE_ENV=development
      - DATABASE_URL=postgres://postgres:postgres@db:5432/analytics
      - JWT_SECRET=dev-secret
    volumes:
      - ./src:/app/src
    depends_on:
      - db
  
  db:
    image: postgres:14
    environment:
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=postgres
      - POSTGRES_DB=analytics
    volumes:
      - pg_data:/var/lib/postgresql/data

volumes:
  pg_data:
```

### Production Deployment

- Build Docker image with production configuration
- Deploy to Kubernetes cluster or container service
- Configure with environment-specific settings
- Set up monitoring and alerting

## 📊 Metrics & KPIs

The dashboard will track and visualize:

1. **Traffic Metrics**
   - Page views
   - Unique visitors
   - Sessions
   - Bounce rate
   - Avg. session duration

2. **Engagement Metrics**
   - Pages per session
   - Event completions
   - Scroll depth
   - Click patterns

3. **Technical Metrics**
   - Page load time
   - Server response time
   - Error rate

4. **Acquisition Metrics**
   - Traffic sources
   - Referrers
   - Campaigns

## 🔐 Security & Compliance

- GDPR compliance for EU users
- Data anonymization options
- Cookie consent integration
- Data retention policies
- Secure data transmission (HTTPS)

## 📝 Documentation

- API documentation via OpenAPI/Swagger
- User guide for dashboard functionality
- Developer documentation for extending the system
- Installation and configuration guide

## 🔄 Maintenance & Updates

- Regular security updates
- Performance optimizations
- New feature additions
- Data archiving strategy

## 📌 Dependencies & Requirements

- Docker and docker-compose
- Node.js v16+ or Python 3.9+
- PostgreSQL 13+
- Redis (for real-time features)
- Access to existing auth system
- Network connectivity for integration

## 📃 Additional Considerations

- **White-labeling**: Allow customers to brand the analytics for their end-users
- **Export functionality**: Support CSV/PDF exports of reports
- **Alert system**: Notify users of unusual traffic patterns
- **Custom events**: Allow tracking of custom user-defined events
- **A/B testing integration**: Connect with experimentation framework
- **Goal tracking**: Allow setting and monitoring conversion goals

## 🗓️ Timeline & Milestones

1. **Week 1-2**: Infrastructure setup and basic API endpoints
2. **Week 3-4**: Data collection and processing implementation
3. **Week 5-6**: Frontend dashboard development
4. **Week 7-8**: Integration, testing, and deployment

## 🔍 Next Steps

1. Set up project repository and Docker configuration
2. Create database schema and migrations
3. Implement basic microservice skeleton with health check
4. Register with the platform using the microservice registry
5. Begin developing core API endpoints
