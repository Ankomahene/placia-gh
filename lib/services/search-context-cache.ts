import { StructuredSearchQuery } from '@/types/search';

export interface CachedSearchContext {
  sessionId: string;
  structuredQuery: StructuredSearchQuery;
  timestamp: Date;
  originalQuery: string;
  userLocation?: { lat: number; lng: number };
}

class SearchContextCache {
  private cache = new Map<string, CachedSearchContext>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Cache cleanup every 30 minutes to prevent memory bloat
    this.cleanupInterval = setInterval(
      () => {
        this.cleanup();
      },
      30 * 60 * 1000
    );
  }

  private cleanup() {
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    let cleanedCount = 0;

    this.cache.forEach((value, key) => {
      if (value.timestamp < thirtyMinutesAgo) {
        this.cache.delete(key);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      console.info(`Cleaned up ${cleanedCount} expired search contexts`);
    }
  }

  set(sessionId: string, context: Omit<CachedSearchContext, 'sessionId'>) {
    if (!sessionId) {
      console.warn('Attempted to cache context without sessionId');
      return;
    }

    this.cache.set(sessionId, {
      sessionId,
      ...context,
      timestamp: new Date(), // Ensure fresh timestamp
    });

    console.info(`Cached search context for session: ${sessionId}`);
  }

  get(sessionId: string): CachedSearchContext | undefined {
    if (!sessionId) return undefined;

    const context = this.cache.get(sessionId);

    // Check if context is still valid (not expired)
    if (context) {
      const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
      if (context.timestamp < thirtyMinutesAgo) {
        this.cache.delete(sessionId);

        return undefined;
      }
    }

    return context;
  }

  clear(sessionId: string): boolean {
    if (!sessionId) return false;
    return this.cache.delete(sessionId);
  }

  // Get cache statistics for debugging
  getStats() {
    return {
      totalSessions: this.cache.size,
      sessions: Array.from(this.cache.keys()),
      cacheEntries: Array.from(this.cache.entries()).map(
        ([sessionId, context]) => ({
          sessionId,
          originalQuery: context.originalQuery,
          location: context.structuredQuery.location,
          category: context.structuredQuery.category,
          timestamp: context.timestamp,
          age: Date.now() - context.timestamp.getTime(),
        })
      ),
    };
  }

  // Log cache activity for debugging
  logCacheActivity() {
    const stats = this.getStats();
    console.info('🔄 Search Context Cache Activity:', {
      totalSessions: stats.totalSessions,
      recentEntries: stats.cacheEntries.slice(-5), // Show last 5 entries
    });
  }

  // Destroy the cache and cleanup interval
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    this.cache.clear();
  }
}

// Create singleton instance
export const searchContextCache = new SearchContextCache();

// Cleanup on process exit
if (typeof process !== 'undefined') {
  process.on('exit', () => {
    searchContextCache.destroy();
  });

  process.on('SIGINT', () => {
    searchContextCache.destroy();
    process.exit(0);
  });
}
