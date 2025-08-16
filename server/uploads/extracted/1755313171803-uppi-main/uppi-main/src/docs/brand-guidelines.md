
# Brand and Design Guidelines

## Overview

This document provides comprehensive guidelines for the platform's brand identity, design language, and component structure. These guidelines ensure visual consistency and a cohesive user experience across the application.

## Typography

### Font Family
- **Primary Font**: Inter (sans-serif)
- **Secondary Font**: SF Mono (monospace) for code and technical displays
- **Fallback Stack**: system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, Roboto, Oxygen, Ubuntu, Cantarell, Fira Sans, Droid Sans, Helvetica Neue, sans-serif

### Font Sizes
- **Headings**:
  - h1: 2.25rem (36px)
  - h2: 1.875rem (30px)
  - h3: 1.5rem (24px)
  - h4: 1.25rem (20px)
  - h5: 1.125rem (18px)
  - h6: 1rem (16px)
- **Body Text**:
  - Default: 1rem (16px)
  - Small: 0.875rem (14px)
  - XSmall: 0.75rem (12px)
- **Line Heights**:
  - Headings: 1.2
  - Body: 1.5
  - Code/Technical: 1.7

## Color Palette

### Primary Colors
- **Primary**: `#0284c7` (blue-600)
- **Primary-Focus**: `#0369a1` (blue-700)
- **Primary-Content**: `#ffffff`

### Secondary Colors
- **Secondary**: `#4f46e5` (indigo-600)
- **Secondary-Focus**: `#4338ca` (indigo-700)
- **Secondary-Content**: `#ffffff`

### Neutral Colors
- **Background**: `#ffffff`
- **Foreground**: `#020617` (slate-950)
- **Card**: `#ffffff`
- **Card-Foreground**: `#020617` (slate-950)

### Utility Colors
- **Success**: `#16a34a` (green-600)
- **Warning**: `#f97316` (orange-500)
- **Error**: `#dc2626` (red-600)
- **Info**: `#2563eb` (blue-600)

### Grayscale
- Foreground/Text: `#020617` (slate-950)
- Muted: `#64748b` (slate-500)
- Muted-Foreground: `#94a3b8` (slate-400)
- Popover: `#ffffff`
- Popover-Foreground: `#020617` (slate-950)
- Border: `#e5e7eb` (gray-200)
- Input: `#e5e7eb` (gray-200)
- Ring: `#94a3b8` (slate-400)

## Spacing

The application uses a consistent spacing scale based on multiples of 4:

- `--space-1`: 0.25rem (4px)
- `--space-2`: 0.5rem (8px)
- `--space-3`: 0.75rem (12px)
- `--space-4`: 1rem (16px)
- `--space-5`: 1.25rem (20px)
- `--space-6`: 1.5rem (24px)
- `--space-8`: 2rem (32px)
- `--space-10`: 2.5rem (40px)
- `--space-12`: 3rem (48px)
- `--space-16`: 4rem (64px)
- `--space-20`: 5rem (80px)
- `--space-24`: 6rem (96px)

## Borders & Shadows

### Borders
- **Border Radius**:
  - Small: 0.125rem (2px)
  - Default: 0.25rem (4px)
  - Medium: 0.375rem (6px)
  - Large: 0.5rem (8px)
  - XLarge: 0.75rem (12px)
  - Full: 9999px (for pills/circles)
- **Border Width**:
  - Default: 1px
  - Medium: 2px
  - Thick: 4px

### Shadows
- **Shadow-sm**: `0 1px 2px 0 rgb(0 0 0 / 0.05)`
- **Shadow**: `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)`
- **Shadow-md**: `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)`
- **Shadow-lg**: `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)`
- **Shadow-xl**: `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)`

## Component Design

### Buttons
- **Variants**:
  - Default: Solid background with white text
  - Outline: Transparent with border and colored text
  - Ghost: No background or border, colored text
  - Link: No background or border, underlined text
  - Destructive: Red background with white text
- **Sizes**:
  - Small: 0.75rem text, 1.5rem height
  - Default: 0.875rem text, 2rem height
  - Large: 1rem text, 2.5rem height
- **States**:
  - Default: Base styles
  - Hover: Slightly darker background/text
  - Focus: Ring outline
  - Active: Darker background/text
  - Disabled: Muted colors, not clickable

### Cards
- Background: White
- Border: 1px border using border color
- Border Radius: 0.5rem
- Padding: 1.5rem
- Shadow: shadow-sm

### Forms
- **Inputs**:
  - Height: 2.5rem
  - Padding: 0.75rem
  - Border: 1px border using input color
  - Border Radius: 0.375rem
  - Focus: Ring outline
- **Labels**:
  - Font Weight: Medium
  - Margin Bottom: 0.25rem
  - Text Color: Slate-700

### Navigation
- **Primary Nav**:
  - Background: White
  - Links: Slate-700
  - Active: Primary color
  - Hover: Slate-900
- **Secondary Nav**:
  - Background: Transparent
  - Border Bottom: 1px border
  - Active: Border bottom primary

## Layout

### Containers
- **Max Width**:
  - Small: 640px
  - Medium: 768px
  - Large: 1024px
  - XLarge: 1280px
  - 2XLarge: 1536px
  
### Grid System
- 12-column grid
- Gap options: 4px, 8px, 16px, 24px, 32px, 64px
- Breakpoints:
  - sm: 640px
  - md: 768px
  - lg: 1024px
  - xl: 1280px
  - 2xl: 1536px

## Animation

### Transition Durations
- **Fast**: 150ms
- **Default**: 200ms
- **Slow**: 300ms
- **Very Slow**: 500ms

### Transition Types
- **Default**: ease-in-out
- **Linear**: linear
- **In**: ease-in
- **Out**: ease-out
- **In-Out**: ease-in-out

### Animation Examples
```css
/* Fade In */
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Slide In */
@keyframes slideIn {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Pulse */
@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## Icons & Imagery

### Icons
- **Icon Library**: Lucide React
- **Icon Sizes**:
  - Small: 1rem (16px)
  - Default: 1.25rem (20px)
  - Large: 1.5rem (24px)
  - XLarge: 2rem (32px)
- **Icon Color**: Match text color of context

### Images
- **Aspect Ratios**:
  - Square: 1:1
  - Standard: 4:3
  - Wide: 16:9
- **Border Radius**: Match component context
- **Loading**: Use blur-up technique

## Microservice Integration Visual Guidelines

### Microservice Status Indicators
- **Online**: Green dot (`bg-green-500`)
- **Offline**: Red dot (`bg-red-500`)
- **Degraded**: Yellow dot (`bg-yellow-500`)
- **Unknown**: Gray dot (`bg-gray-400`)

### API Method Badges
- **GET**: Blue badge (`bg-blue-100 text-blue-700`)
- **POST**: Green badge (`bg-green-100 text-green-700`)
- **PUT**: Amber badge (`bg-amber-100 text-amber-700`)
- **DELETE**: Red badge (`bg-red-100 text-red-700`)
- **PATCH**: Purple badge (`bg-purple-100 text-purple-700`)

### Integration Sections
- Use cards to visually separate microservice information
- Consistent padding and spacing
- Clear hierarchy of information
- Collapsible sections for endpoint details

## Code Standards

### Naming Conventions
- **Components**: PascalCase (e.g., `Button.tsx`)
- **Hooks**: camelCase with 'use' prefix (e.g., `useAuth.ts`)
- **Utilities**: camelCase (e.g., `formatDate.ts`)
- **Types/Interfaces**: PascalCase (e.g., `UserProfile`)

### Component Structure
- Consistent order of imports
- Props interface defined at the top
- Component documentation with JSDoc
- Export at the bottom

### CSS/Tailwind Patterns
- Mobile-first responsive design
- Composition over inheritance
- Use utility classes for one-off styling
- Extract common patterns into components

## Accessibility

### Color Contrast
- All text should have a minimum contrast ratio of 4.5:1
- Interactive elements should have a minimum contrast ratio of 3:1

### Focus States
- All interactive elements must have visible focus states
- Use outline and ring utilities

### Screen Readers
- Use semantic HTML elements
- Include appropriate ARIA attributes
- Ensure proper heading hierarchy

## Microservice Integration Best Practices

For AI agents and developers implementing microservices:

1. **Consistent Error Handling**:
   - Use standard error response format
   - Implement appropriate error status codes
   - Provide meaningful error messages

2. **API Documentation**:
   - Provide OpenAPI/Swagger documentation
   - Include example requests and responses
   - Document authentication requirements

3. **Versioning**:
   - Include version in URL path (/v1/resource)
   - Document breaking changes
   - Maintain backward compatibility when possible

4. **Response Format**:
   - Use consistent JSON structure
   - Include metadata with each response (pagination, etc.)
   - Follow REST principles

5. **UI Integration**:
   - Follow the visual guidelines in this document
   - Use existing component patterns
   - Maintain consistent spacing and typography

## Resources

- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Lucide Icons](https://lucide.dev/)
- [shadcn/ui Components](https://ui.shadcn.com/)
- [Microservice Integration Guide](../docs/microservice-integration.md)
