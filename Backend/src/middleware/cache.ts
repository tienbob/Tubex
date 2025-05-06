import { Request, Response, NextFunction } from 'express';
import { RedisCacheService } from '../services/cache/redis.service';
import { redisClient } from '../database';

/**
 * Middleware to cache API responses
 * @param ttl Time to live in seconds (default: 5 minutes)
 */
export const cacheResponse = (ttl = 300) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip caching for non-GET requests
    if (req.method !== 'GET') {
      return next();
    }

    // Create a cache key based on the URL and any query params
    const cacheKey = `${req.originalUrl || req.url}`;
    
    try {
      // Try to get from cache
      const cachedData = await RedisCacheService.getCachedApiResponse(cacheKey);
      
      if (cachedData) {
        return res.status(200).json({
          ...cachedData,
          _cached: true
        });
      }

      // Store original send method to intercept the response
      const originalSend = res.send;
      
      // Override send to cache the response before sending
      res.send = function(body: any): Response {
        // Only cache successful responses
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(body);
            RedisCacheService.cacheApiResponse(cacheKey, data, ttl);
          } catch (e) {
            // If we can't parse the body, just continue without caching
            console.error('Error parsing response body for caching', e);
          }
        }
        
        // Call the original send method
        return originalSend.call(this, body);
      };
      
      next();
    } catch (error) {
      // If anything fails, skip caching
      next();
    }
  };
};

/**
 * Middleware to clear cache for specific patterns
 * @param patterns Array of cache key patterns to clear
 */
export const clearCache = (patterns: string[]) => {
  return async (_req: Request, res: Response, next: NextFunction) => {
    try {
      // Process after response is sent to client
      res.on('finish', async () => {
        // Only clear cache for successful operations
        if (res.statusCode >= 200 && res.statusCode < 300) {
          for (const pattern of patterns) {
            const keys = await redisClient.keys(`api:${pattern}`);
            if (keys.length > 0) {
              await redisClient.del(keys);
            }
          }
        }
      });
      
      next();
    } catch (error) {
      // If anything fails, skip cache clearing
      next();
    }
  };
};