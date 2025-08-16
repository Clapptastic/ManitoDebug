
# Technology Stack

## Overview

Uppi.ai 2.0 utilizes a modern technology stack optimized for developer productivity, performance, and scalability. This document outlines the technologies used throughout the application.

## Frontend Technologies

### Core Framework
- **React 18+**: UI library with concurrent rendering capabilities
- **TypeScript**: Static typing for improved code quality and developer experience
- **Vite**: Fast, modern build tool for development and production builds

### UI Components and Styling
- **Tailwind CSS**: Utility-first CSS framework
- **shadcn/ui**: High-quality, customizable UI components
- **Lucide React**: Modern icon library
- **Framer Motion**: Animation library for interactive UI elements

### State Management
- **TanStack Query (React Query)**: Server state management and caching
- **React Context API**: Global state management for app-wide state
- **Zustand**: Lightweight state management for complex state logic

### Data Visualization
- **Recharts**: Composable charting library for data visualization
- **react-flow**: Interactive node-based visualizations

### Form Handling
- **React Hook Form**: Performance-focused form management
- **Zod**: Schema validation for form inputs and API payloads

### Additional Frontend Libraries
- **date-fns**: Modern date manipulation library
- **Embla Carousel**: Flexible carousel/slider component
- **React Router**: Application routing
- **React Error Boundary**: Error handling component

## Backend Technologies

### Database
- **Supabase**: PostgreSQL database with additional features
- **PostgreSQL 15+**: Advanced relational database

### Authentication and Authorization
- **Supabase Auth**: JWT-based authentication
- **Row Level Security (RLS)**: PostgreSQL-native authorization rules

### Server-side Logic
- **Supabase Edge Functions**: Serverless functions for API logic
- **TypeScript**: Type-safe server-side code

### File Storage
- **Supabase Storage**: Object storage for files and documents

### Real-time Features
- **Supabase Realtime**: WebSocket-based real-time capabilities

## AI Integration Technologies

### AI Service Providers
- **OpenAI API**: GPT-4 and other models
- **Anthropic Claude API**: Claude models for specialized tasks
- **Perplexity API**: Research-focused AI
- **Google Gemini API**: Google's latest AI models
- **Mistral AI**: Open source models

### AI Integration
- **LangChain**: Framework for AI service management
- **OpenAI Function Calling**: Structured outputs from AI models

## DevOps and Infrastructure

### CI/CD
- **GitHub Actions**: Automated testing and deployment
- **Vercel**: Frontend deployment platform

### Testing
- **Jest**: JavaScript testing framework
- **React Testing Library**: Component testing utilities
- **MSW**: API mocking for tests
- **Vitest**: Fast testing framework

### Monitoring and Logging
- **Supabase Monitoring**: Database and edge function monitoring
- **Error tracking**: Integrated error reporting

## Development Tools

### Code Quality
- **ESLint**: JavaScript/TypeScript linting
- **Prettier**: Code formatting
- **TypeScript**: Static type checking

### Documentation
- **TypeDoc**: API documentation generator
- **Storybook**: UI component documentation and testing

### Package Management
- **npm/yarn**: Dependency management

## Security Tools

### Data Protection
- **PostgreSQL RLS**: Row-level security policies
- **JWT**: Token-based authentication
- **API Key Encryption**: Secure storage of third-party API keys

### Compliance
- **GDPR-compliant architecture**
- **CCPA-compliant data handling**
