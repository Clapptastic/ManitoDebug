
/**
 * Wiki system types
 */

export interface WikiDocument {
  id: string;
  title: string;
  category: string;
  path?: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  imageAlt?: string;
  lastUpdated?: string;
  author?: string;
  tags?: string[];
  relatedDocs?: string[];
}

export interface WikiCategory {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
}

export interface WikiSearchResult {
  documentId: string;
  title: string;
  excerpt: string;
  matchedContent: string;
  category: string;
  relevanceScore: number;
}
