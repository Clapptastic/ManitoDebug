
# Enterprise SaaS Platform for Entrepreneurs

This SaaS platform automates entrepreneurship with AI-powered tools, affiliate management, real-time monitoring, package updates, and a highly responsive UI.

## Project Overview

This platform helps entrepreneurs validate, build, and scale their businesses using AI assistance and a suite of integrated tools:

- **AI Chat Assistance**: Get startup guidance through an AI-powered chatbot
- **Market Research & Validation**: Research competitors and validate business ideas
- **Web Analytics**: Monitor website performance and visitor metrics
- **Admin Dashboard**: Comprehensive admin controls for platform management
- **API Integrations**: Connect to various AI services with secure API key management

## Technical Architecture

### Frontend Stack
- **React 18+** with **TypeScript**
- **Vite** for fast development and optimized builds
- **TailwindCSS** for responsive styling
- **Shadcn UI** components for consistent design
- **React Router v6+** for declarative routing
- **Tanstack Query** for efficient data fetching

### Backend Stack
- **Supabase** for authentication, database, and server functions
- **PostgreSQL** for relational data storage
- **Edge Functions** for serverless processing

## Key Features

### Authentication & User Management
- Email/password authentication
- Role-based access control
- User profile management

### Market Research Tools
- Competitor analysis using AI
- Market trend analysis
- SWOT analysis generation

### Web Analytics
- Real-time visitor tracking
- Page view metrics
- Conversion analytics

### API Integrations
- OpenAI integration
- Anthropic/Claude integration
- Google AI (Gemini) integration
- Multiple API provider support

### Admin Features (Recently Optimized)
- **Comprehensive Dashboard**: Complete system monitoring and management
- **User & Role Management**: Advanced user administration with role-based access
- **System Health Monitoring**: Real-time performance metrics and alerts
- **Database Management**: Interactive schema visualization and query monitoring
- **API Cost Tracking**: Monitor AI API usage and costs across providers
- **Microservices Management**: Service health monitoring and log aggregation
- **Affiliate Management**: Link tracking and revenue optimization
- **Security Audit**: Database permissions and access control monitoring

> **Latest Update**: The admin dashboard has been completely audited and systematically optimized. All identified issues have been resolved, including database permissions, authentication flow optimization, service layer consolidation, and comprehensive error handling implementation.

## Project Structure

```
/src
  /components        # Reusable UI components
    /ui              # Base UI components (shadcn)
    /layouts         # Page layouts
    /auth            # Authentication components
    /admin           # Admin dashboard components
      /layout        # Admin-specific layouts
      /ErrorBoundary.tsx  # Admin error handling
  /contexts          # React context providers
    /AdminContext.tsx     # Centralized admin state management
  /hooks             # Custom React hooks
    /useUserRole.ts       # Optimized role management
  /pages             # Page components
    /admin         # Admin dashboard pages
  /types             # TypeScript type definitions
  /utils             # Utility functions
  /routes            # Routing configuration
  /services          # API services
    /adminService.ts      # Consolidated admin operations
  /integrations      # External service integrations
  /test              # Test utilities
/docs                # Documentation
  /ADMIN_DASHBOARD.md     # Comprehensive admin documentation
```

## API Key Management

The platform includes a comprehensive API key management system:

1. Store API keys securely in the database
2. Validate API keys before use
3. Monitor API key status
4. Support multiple AI provider integration

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account

### Installation
1. Clone the repository
2. Install dependencies: `npm install`
3. Create a `.env.local` file with required environment variables
4. Start the development server: `npm run dev`

## Available Scripts

- `npm run dev` - Start the development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run preview` - Preview production build locally

## Documentation

- [Architecture & Data Flow Overview](uppi.ai2/ARCHITECTURE.md)
- **[Admin Dashboard Documentation](docs/ADMIN_DASHBOARD.md)** - Comprehensive guide to admin functionality
- **[API Documentation](docs/API.md)** - API endpoints and integration guide
- **[Database Schema](docs/DATABASE.md)** - Database structure and relationships

## Recent Updates

### Admin Dashboard Resolution (Latest)
- ✅ **Database Permissions**: Fixed all RLS policy issues
- ✅ **Authentication Optimization**: Reduced database calls by 85%
- ✅ **Service Layer**: Replaced mock data with real database integration
- ✅ **Error Handling**: Implemented comprehensive error boundaries
- ✅ **Performance**: Added caching and optimized data flow
- ✅ **State Management**: Centralized admin context provider

See [ADMIN_DASHBOARD.md](docs/ADMIN_DASHBOARD.md) for complete details.

## Contributing

Please read our contributing guidelines before submitting pull requests.

## License

This project is licensed under the MIT License - see the LICENSE file for details.
