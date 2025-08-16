# Source Citations Component Refactor Report

Last updated: 2025-08-10

## Overview
This report documents the refactor of the `SourceCitations` (MarketSourceCitations) component to ensure it renders real data returned from competitor analyses while adhering to UI/UX and design best practices.

## Objectives
- Render real citations from `analysis.source_citations` with a fallback to `analysis.analysis_data.citations`.
- Group citations by `field` and display provider badges, confidence chips, and verified links.
- Improve responsiveness, accessibility, and readability using the design system tokens.
- Preserve existing functionality and add non-breaking enhancements only.

## Data Contract
The component supports the following shapes:
- Primary: `analysis.source_citations: Array<{ field: string; source: string; url?: string; confidence?: number; reliability_score?: number; data_type?: string; provider?: string; verified?: boolean; }>`
- Fallback: `analysis.analysis_data.citations` with matching fields

Normalization ensures the following fields are available per item:
- field (group key)
- source (display name)
- url (optional, external link)
- confidence (0-100)
- reliability_score (0-100)
- data_type (e.g., report, api, news)
- provider (e.g., OpenAI, Anthropic, Perplexity)
- verified (boolean)

## Rendering Logic (Summary)
- Empty state if no citations found (primary or fallback)
- Overall data quality card: average confidence and distribution
- Grouped by `field` with a list of sources; each item includes:
  - Provider badge (when available)
  - Confidence chip with semantic color
  - Reliability score subtle text
  - External link icon if `url` is provided, opening in a new tab with `rel="noopener noreferrer"`
- Legend explaining confidence tiers

## UI/UX Enhancements
- Semantic tokens and shadcn UI components used; no raw color literals
- Compact layout on mobile, multi-column flow on md+ screens
- Iconography communicates confidence tiers and verification
- High-contrast badges and chips for readability

## Accessibility
- Semantic regions and headings per section
- aria-labels on actionable elements and icons
- External links include `rel` for security and `title` attributes
- Meaning is conveyed by text in addition to color

## Performance
- Pure presentational mappings; O(n) rendering
- Stable keys from citation identity
- No heavy computations in render path

## Testing Notes
- Unit tests should verify:
  - Normalization (primary and fallback sources)
  - Group-by rendering (fields as sections)
  - Confidence color mapping thresholds
  - External link presence when `url` provided
- E2E coverage ensures empty and populated states behave as expected

## Security & Privacy
- All links open in a new tab with safe rel attributes
- No secrets are exposed

## Change Log
- Added normalization & fallback to `analysis_data.citations`
- Introduced provider badges and confidence chips
- Improved empty state and legend
- Kept API surface compatible with previous props

## Next Steps
- Add copy-to-clipboard for citation URLs
- Optional: filter chips by provider and min confidence
