
# Render Utilities

This module provides utility functions for rendering data in a consistent way throughout the application, particularly for competitor analysis components.

## Core Functions

### `safeRenderValue(value, fallback = 'Not specified')`
Safely renders a value, with fallback for undefined, null or empty values.
```typescript
import { safeRenderValue } from '@/utils/renderUtils';

// Examples
safeRenderValue('Present value'); // 'Present value'
safeRenderValue(null); // 'Not specified'
safeRenderValue(undefined, 'Unknown'); // 'Unknown'
```

### `formatRelativeTime(dateString)`
Formats a date string relative to the current time (e.g., "2 days ago").
```typescript
import { formatRelativeTime } from '@/utils/renderUtils';

// Example
formatRelativeTime('2023-05-01T12:00:00Z'); // '2 years ago' (depending on current date)
```

### `formatDate(dateString, options = {})`
Formats a date string using the browser's Intl.DateTimeFormat.
```typescript
import { formatDate } from '@/utils/renderUtils';

// Examples
formatDate('2023-05-01'); // 'May 1, 2023'
formatDate('2023-05-01', { year: 'numeric', month: 'long' }); // 'May 2023'
```

### `renderSwotItem(item)`
Renders a SWOT item, handling both string and object formats.
```typescript
import { renderSwotItem } from '@/utils/renderUtils';

// Examples
renderSwotItem('Strong product'); // 'Strong product'
renderSwotItem({ content: 'Strong product' }); // 'Strong product'
renderSwotItem({ text: 'Strong product' }); // 'Strong product'
```

## Format Functions

### `formatPercent(value)`
Formats a number as a percentage with the % sign.
```typescript
formatPercent(0.35); // '0.35%'
```

### `formatScoreAsPercentage(value)`
Formats a score as a percentage, normalizing values between 0-1 or 0-100.
```typescript
formatScoreAsPercentage(0.35); // '35.0%'
formatScoreAsPercentage(35); // '35.0%'
```

### `formatPercentage(value, decimals = 1)`
Alias for formatScoreAsPercentage for backward compatibility.
```typescript
formatPercentage(0.3567); // '35.7%'
```

### `formatCurrency(value, currency = 'USD', locale = 'en-US')`
Formats a number as currency.
```typescript
formatCurrency(1234.56); // '$1,235'
formatCurrency(1234.56, 'EUR', 'de-DE'); // '1.235 €'
```

### `formatNumber(value)`
Formats a number with commas as thousands separators.
```typescript
formatNumber(1234567); // '1,234,567'
```

### `truncateText(text, maxLength = 100, suffix = '...')`
Truncates text to a specific length.
```typescript
truncateText('This is a long text', 10); // 'This is a...'
```

## Utility Functions

### `normalizeCompetitorData(data)`
Normalizes competitor data from various sources into a consistent format.
```typescript
normalizeCompetitorData(rawData); // Normalized CompetitorData object
```
