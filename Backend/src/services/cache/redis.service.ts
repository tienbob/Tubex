import { redisClient } from '../../database';

/**
 * Redis Caching Service
 * Implements the caching strategy outlined in the TDD
 * - Token storage
 * - Rate limiting
 * - General-purpose caching
 */
export class RedisCacheService {
  /**
   * Set a value in cache
   * @param key The cache key
   * @param value The value to cache
   * @param ttlSeconds Time to live in seconds
   */
  static async set(key: string, value: string | number | object, ttlSeconds?: number): Promise<void> {
    // Convert objects to strings for storage
    const stringValue = typeof value === 'object' ? JSON.stringify(value) : String(value);
    
    if (ttlSeconds) {
      await redisClient.set(key, stringValue, { EX: ttlSeconds });
    } else {
      await redisClient.set(key, stringValue);
    }
  }

  /**
   * Get a value from cache
   * @param key The cache key
   * @param parseJson Whether to parse the value as JSON
   * @returns The cached value or null if not found
   */
  static async get(key: string, parseJson = false): Promise<any> {
    const value = await redisClient.get(key);
    if (!value) return null;
    
    if (parseJson) {
      try {
        return JSON.parse(value);
      } catch (e) {
        return value;
      }
    }
    
    return value;
  }

  /**
   * Delete a value from cache
   * @param key The cache key or pattern
   */
  static async del(key: string): Promise<void> {
    await redisClient.del(key);
  }

  /**
   * Check if a key exists
   * @param key The cache key
   * @returns True if the key exists
   */
  static async exists(key: string): Promise<boolean> {
    const result = await redisClient.exists(key);
    return result > 0;
  }

  /**
   * Increment a counter
   * @param key The counter key
   * @param ttlSeconds Time to live in seconds
   * @returns The new counter value
   */
  static async increment(key: string, ttlSeconds?: number): Promise<number> {
    const value = await redisClient.incr(key);
    if (ttlSeconds && value === 1) {
      await redisClient.expire(key, ttlSeconds);
    }
    return value;
  }

  /**
   * Cache API response
   * @param key The cache key (usually route path)
   * @param data The response data
   * @param ttlSeconds Time to live in seconds (default: 5 minutes)
   */
  static async cacheApiResponse(key: string, data: any, ttlSeconds = 300): Promise<void> {
    await this.set(`api:${key}`, data, ttlSeconds);
  }

  /**
   * Get cached API response
   * @param key The cache key (usually route path)
   * @returns The cached response or null
   */
  static async getCachedApiResponse(key: string): Promise<any> {
    return await this.get(`api:${key}`, true);
  }

  /**
   * Store a JWT token
   * @param userId User ID
   * @param tokenType Type of token (access, refresh)
   * @param token The token string
   * @param ttlSeconds Time to live in seconds
   */
  static async storeToken(userId: string, tokenType: string, token: string, ttlSeconds: number): Promise<void> {
    await this.set(`token:${tokenType}:${userId}`, token, ttlSeconds);
  }

  /**
   * Get a stored token
   * @param userId User ID
   * @param tokenType Type of token (access, refresh)
   * @returns The token or null if not found
   */
  static async getToken(userId: string, tokenType: string): Promise<string | null> {
    return await this.get(`token:${tokenType}:${userId}`);
  }

  /**
   * Invalidate a user's tokens
   * @param userId User ID
   */
  static async invalidateUserTokens(userId: string): Promise<void> {
    const keys = await redisClient.keys(`token:*:${userId}`);
    if (keys.length > 0) {
      await redisClient.del(keys);
    }
  }
}