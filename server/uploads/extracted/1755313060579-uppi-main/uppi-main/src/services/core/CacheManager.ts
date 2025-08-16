/**
 * Unified Cache Manager
 * Centralized cache invalidation and management
 */

export interface CacheEntry<T = any> {
  data: T;
  timestamp: number;
  ttl: number;
  tags: Set<string>;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
}

class CacheManager {
  private cache = new Map<string, CacheEntry>();
  private defaultTtl = 5 * 60 * 1000; // 5 minutes
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  /**
   * Set cache entry with tags for organized invalidation
   */
  set<T = any>(key: string, data: T, options: CacheOptions = {}): void {
    const ttl = options.ttl || this.defaultTtl;
    const tags = new Set(options.tags || []);
    
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags
    });
  }

  /**
   * Get cache entry if not expired
   */
  get<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now > entry.timestamp + entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Check if key exists and is not expired
   */
  has(key: string): boolean {
    return this.get(key) !== null;
  }

  /**
   * Delete specific key
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Invalidate cache by tags
   */
  invalidateByTag(...tags: string[]): number {
    const tagSet = new Set(tags);
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      for (const tag of tagSet) {
        if (entry.tags.has(tag)) {
          keysToDelete.push(key);
          break;
        }
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache invalidated ${keysToDelete.length} entries for tags:`, tags);
    }

    return keysToDelete.length;
  }

  /**
   * Invalidate cache by prefix
   */
  invalidateByPrefix(prefix: string): number {
    const keysToDelete: string[] = [];

    for (const key of this.cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache invalidated ${keysToDelete.length} entries with prefix: ${prefix}`);
    }

    return keysToDelete.length;
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    hitRate: number;
    memoryUsage: number;
    tagDistribution: Record<string, number>;
  } {
    let totalSize = 0;
    const tagCounts: Record<string, number> = {};

    for (const entry of this.cache.values()) {
      // Rough estimation of memory usage
      totalSize += JSON.stringify(entry.data).length;
      
      for (const tag of entry.tags) {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      }
    }

    return {
      size: this.cache.size,
      hitRate: 0, // Would need hit/miss tracking
      memoryUsage: totalSize,
      tagDistribution: tagCounts
    };
  }

  /**
   * Clean up expired entries
   */
  cleanup(): number {
    const now = Date.now();
    const keysToDelete: string[] = [];

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.timestamp + entry.ttl) {
        keysToDelete.push(key);
      }
    }

    keysToDelete.forEach(key => this.cache.delete(key));
    
    if (keysToDelete.length > 0) {
      console.log(`Cache cleanup removed ${keysToDelete.length} expired entries`);
    }

    return keysToDelete.length;
  }

  /**
   * Generate cache key for data operations
   */
  generateKey(table: string, options: any = {}): string {
    return `${table}:${JSON.stringify(options)}`;
  }

  /**
   * Generate cache key for single item
   */
  generateItemKey(table: string, id: string): string {
    return `${table}:item:${id}`;
  }

  /**
   * Helper methods for common cache patterns
   */
  
  // Cache user-specific data
  setUserData<T>(userId: string, dataType: string, data: T, ttl?: number): void {
    this.set(`user:${userId}:${dataType}`, data, {
      ttl,
      tags: [`user:${userId}`, `type:${dataType}`]
    });
  }

  getUserData<T>(userId: string, dataType: string): T | null {
    return this.get<T>(`user:${userId}:${dataType}`);
  }

  // Cache table data
  setTableData<T>(table: string, data: T, filters?: any, ttl?: number): void {
    const key = this.generateKey(table, filters);
    this.set(key, data, {
      ttl,
      tags: [`table:${table}`, 'data:list']
    });
  }

  getTableData<T>(table: string, filters?: any): T | null {
    const key = this.generateKey(table, filters);
    return this.get<T>(key);
  }

  // Cache single items
  setItem<T>(table: string, id: string, data: T, ttl?: number): void {
    const key = this.generateItemKey(table, id);
    this.set(key, data, {
      ttl,
      tags: [`table:${table}`, `item:${id}`, 'data:item']
    });
  }

  getItem<T>(table: string, id: string): T | null {
    const key = this.generateItemKey(table, id);
    return this.get<T>(key);
  }

  // Invalidate all data for a table
  invalidateTable(table: string): number {
    return this.invalidateByTag(`table:${table}`);
  }

  // Invalidate all data for a user
  invalidateUser(userId: string): number {
    return this.invalidateByTag(`user:${userId}`);
  }

  // Invalidate specific item
  invalidateItem(table: string, id: string): number {
    return this.invalidateByTag(`item:${id}`);
  }

  /**
   * Start automatic cleanup interval
   */
  private startCleanupInterval(): void {
    if (this.cleanupInterval) return;

    // Clean up every 5 minutes with error handling to prevent infinite loops
    this.cleanupInterval = setInterval(() => {
      try {
        this.cleanup();
      } catch (error) {
        console.error('Cache cleanup error:', error);
      }
    }, 5 * 60 * 1000);
  }

  /**
   * Stop cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.clear();
  }
}

// Export singleton instance
export const cacheManager = new CacheManager();

// Cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', () => {
    cacheManager.destroy();
  });
}

export default cacheManager;