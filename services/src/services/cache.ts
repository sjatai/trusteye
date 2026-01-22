// Intelligent Caching Service
// Provides LRU cache with TTL, semantic similarity matching for AI queries

import crypto from 'crypto';

interface CacheEntry<T> {
  value: T;
  timestamp: number;
  ttl: number;
  hits: number;
  key: string;
  semanticKey?: string;
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
  savedTokens: number;
  savedMs: number;
}

// Simple in-memory LRU Cache with TTL
class LRUCache<T> {
  private cache: Map<string, CacheEntry<T>> = new Map();
  private maxSize: number;
  private defaultTTL: number;
  private stats = { hits: 0, misses: 0, savedTokens: 0, savedMs: 0 };

  constructor(maxSize: number = 1000, defaultTTL: number = 300000) {
    this.maxSize = maxSize;
    this.defaultTTL = defaultTTL; // 5 minutes default
  }

  set(key: string, value: T, ttl?: number, semanticKey?: string): void {
    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) this.cache.delete(oldestKey);
    }

    // Delete existing to update position in LRU
    this.cache.delete(key);

    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
      hits: 0,
      key,
      semanticKey,
    });
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    // Update LRU position
    this.cache.delete(key);
    entry.hits++;
    this.cache.set(key, entry);

    this.stats.hits++;
    return entry.value;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    return true;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  getStats(): CacheStats {
    const total = this.stats.hits + this.stats.misses;
    return {
      ...this.stats,
      size: this.cache.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
    };
  }

  recordSavings(tokens: number, ms: number): void {
    this.stats.savedTokens += tokens;
    this.stats.savedMs += ms;
  }

  // Get all entries (for debugging)
  entries(): Array<[string, CacheEntry<T>]> {
    return Array.from(this.cache.entries());
  }
}

// Semantic Cache - finds similar queries
class SemanticCache {
  private cache: LRUCache<any>;
  private keywordIndex: Map<string, Set<string>> = new Map();

  constructor(maxSize: number = 500, ttl: number = 600000) {
    this.cache = new LRUCache(maxSize, ttl); // 10 min default for AI
  }

  // Generate a normalized key from query
  private normalizeQuery(query: string): string {
    return query
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Extract keywords for similarity matching
  private extractKeywords(query: string): string[] {
    const stopWords = new Set([
      'a', 'an', 'the', 'is', 'are', 'was', 'were', 'be', 'been',
      'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
      'would', 'could', 'should', 'may', 'might', 'can', 'to', 'of',
      'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into',
      'through', 'during', 'before', 'after', 'above', 'below', 'up',
      'down', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
      'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all',
      'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
      'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
      'just', 'and', 'but', 'if', 'or', 'because', 'until', 'while',
      'what', 'which', 'who', 'whom', 'this', 'that', 'these', 'those',
      'am', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you', 'your',
      'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
      'please', 'help', 'want', 'need', 'like', 'make', 'create', 'give'
    ]);

    const normalized = this.normalizeQuery(query);
    return normalized
      .split(' ')
      .filter(word => word.length > 2 && !stopWords.has(word));
  }

  // Calculate similarity between two keyword sets
  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    if (keywords1.length === 0 || keywords2.length === 0) return 0;

    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    let intersection = 0;
    for (const word of set1) {
      if (set2.has(word)) intersection++;
    }

    // Jaccard similarity
    const union = new Set([...set1, ...set2]).size;
    return intersection / union;
  }

  // Find similar cached query
  findSimilar(query: string, threshold: number = 0.6): { key: string; value: any; similarity: number } | null {
    const queryKeywords = this.extractKeywords(query);
    if (queryKeywords.length === 0) return null;

    let bestMatch: { key: string; value: any; similarity: number } | null = null;

    // Check keyword index for potential matches
    const potentialMatches = new Set<string>();
    for (const keyword of queryKeywords) {
      const matches = this.keywordIndex.get(keyword);
      if (matches) {
        for (const key of matches) {
          potentialMatches.add(key);
        }
      }
    }

    // Calculate similarity for potential matches
    for (const cacheKey of potentialMatches) {
      const entry = this.cache.get(cacheKey);
      if (!entry) continue;

      const cachedKeywords = this.extractKeywords(entry.originalQuery || '');
      const similarity = this.calculateSimilarity(queryKeywords, cachedKeywords);

      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { key: cacheKey, value: entry, similarity };
      }
    }

    return bestMatch;
  }

  set(query: string, value: any, ttl?: number): string {
    const normalized = this.normalizeQuery(query);
    const key = crypto.createHash('md5').update(normalized).digest('hex');
    const keywords = this.extractKeywords(query);

    // Store with original query for similarity matching
    this.cache.set(key, { ...value, originalQuery: query }, ttl);

    // Update keyword index
    for (const keyword of keywords) {
      if (!this.keywordIndex.has(keyword)) {
        this.keywordIndex.set(keyword, new Set());
      }
      this.keywordIndex.get(keyword)!.add(key);
    }

    return key;
  }

  get(query: string): any | null {
    const normalized = this.normalizeQuery(query);
    const key = crypto.createHash('md5').update(normalized).digest('hex');
    return this.cache.get(key);
  }

  getStats(): CacheStats {
    return this.cache.getStats();
  }

  recordSavings(tokens: number, ms: number): void {
    this.cache.recordSavings(tokens, ms);
  }

  clear(): void {
    this.cache.clear();
    this.keywordIndex.clear();
  }
}

// Create cache instances
const aiCache = new SemanticCache(500, 10 * 60 * 1000); // 10 min TTL for AI responses
const knowledgeCache = new LRUCache<any>(1000, 30 * 60 * 1000); // 30 min for knowledge base
const apiCache = new LRUCache<any>(500, 5 * 60 * 1000); // 5 min for API responses
const intentCache = new LRUCache<any>(200, 60 * 60 * 1000); // 1 hour for intent parsing

// Cache key generators
function generateCacheKey(prefix: string, ...args: any[]): string {
  const data = JSON.stringify(args);
  const hash = crypto.createHash('md5').update(data).digest('hex');
  return `${prefix}:${hash}`;
}

// Exported cache functions
export const cache = {
  // AI Response Caching (with semantic similarity)
  ai: {
    get: (query: string, options?: any): any | null => {
      // First try exact match
      const exact = aiCache.get(query);
      if (exact) {
        console.log(`[Cache] AI exact hit for: "${query.substring(0, 50)}..."`);
        return exact;
      }

      // Try semantic match
      const similar = aiCache.findSimilar(query, 0.65);
      if (similar) {
        console.log(`[Cache] AI semantic hit (${(similar.similarity * 100).toFixed(0)}%): "${query.substring(0, 50)}..."`);
        return similar.value;
      }

      return null;
    },
    set: (query: string, response: any, estimatedTokens?: number): void => {
      aiCache.set(query, response);
      if (estimatedTokens) {
        aiCache.recordSavings(estimatedTokens, 0);
      }
    },
    stats: () => aiCache.getStats(),
  },

  // Knowledge Base / RAG Caching
  knowledge: {
    get: (query: string, filters?: any): any | null => {
      const key = generateCacheKey('kb', query, filters);
      const result = knowledgeCache.get(key);
      if (result) {
        console.log(`[Cache] Knowledge hit for: "${query.substring(0, 50)}..."`);
      }
      return result;
    },
    set: (query: string, filters: any, results: any): void => {
      const key = generateCacheKey('kb', query, filters);
      knowledgeCache.set(key, results);
    },
    stats: () => knowledgeCache.getStats(),
  },

  // API Response Caching
  api: {
    get: (endpoint: string, params?: any): any | null => {
      const key = generateCacheKey('api', endpoint, params);
      const result = apiCache.get(key);
      if (result) {
        console.log(`[Cache] API hit for: ${endpoint}`);
      }
      return result;
    },
    set: (endpoint: string, params: any, response: any, ttl?: number): void => {
      const key = generateCacheKey('api', endpoint, params);
      apiCache.set(key, response, ttl);
    },
    invalidate: (endpoint: string, params?: any): void => {
      const key = generateCacheKey('api', endpoint, params);
      apiCache.delete(key);
    },
    stats: () => apiCache.getStats(),
  },

  // Intent Parsing Cache (high hit rate expected)
  intent: {
    get: (message: string): any | null => {
      const key = generateCacheKey('intent', message.toLowerCase().trim());
      return intentCache.get(key);
    },
    set: (message: string, intent: any): void => {
      const key = generateCacheKey('intent', message.toLowerCase().trim());
      intentCache.set(key, intent);
    },
    stats: () => intentCache.getStats(),
  },

  // Get all stats
  getAllStats: (): Record<string, CacheStats> => ({
    ai: aiCache.getStats(),
    knowledge: knowledgeCache.getStats(),
    api: apiCache.getStats(),
    intent: intentCache.getStats(),
  }),

  // Clear all caches
  clearAll: (): void => {
    aiCache.clear();
    knowledgeCache.clear();
    apiCache.clear();
    intentCache.clear();
    console.log('[Cache] All caches cleared');
  },
};

// Express middleware for API caching
export function apiCacheMiddleware(ttl: number = 60000) {
  return (req: any, res: any, next: any) => {
    // Only cache GET requests
    if (req.method !== 'GET') {
      return next();
    }

    const key = generateCacheKey('api', req.originalUrl, req.query);
    const cached = apiCache.get(key);

    if (cached) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached);
    }

    // Store original json method
    const originalJson = res.json.bind(res);

    // Override json to cache response
    res.json = (body: any) => {
      if (res.statusCode === 200) {
        apiCache.set(key, body, ttl);
      }
      res.setHeader('X-Cache', 'MISS');
      return originalJson(body);
    };

    next();
  };
}

export default cache;
