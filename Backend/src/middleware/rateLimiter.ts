import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '../database';
import { config } from '../config';

// Function to determine which store to use based on environment
const getRateLimitStore = () => {
  // In development mode, use the default memory store
  if (config.nodeEnv === 'development') {
    console.log('Using memory store for rate limiting in development mode');
    return undefined; // Default memory store
  }

  // In production, use Redis store with proper error handling
  try {
    return new RedisStore({
      // Use compatible Redis client configuration
      // @ts-ignore - Working around type incompatibility
      sendCommand: async (args) => {
        try {
          // Modified to ensure non-null return and proper command format
          return await redisClient.sendCommand([args]) || { };
        } catch (error) {
          console.error('Redis command error:', error);
          // Return empty object instead of null to satisfy type constraints
          return { };
        }
      },
      // Add additional options if needed
      prefix: 'rl:', // Add prefix to Redis keys
    });
  } catch (error) {
    console.error('Failed to initialize Redis store for rate limiting:', error);
    console.warn('Falling back to memory store for rate limiting');
    return undefined; // Fall back to memory store
  }
};

// General rate limiter - for all other endpoints
export const rateLimiter = rateLimit({
  store: getRateLimitStore(),
  windowMs: 60 * 1000, // 1 minute
  max: config.nodeEnv === 'development' ? 1000 : 100, // 1000 requests per minute in development, 100 in production
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter with production-appropriate settings
export const authLimiter = rateLimit({
  store: getRateLimitStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.nodeEnv === 'development' ? 100 : 5, // 5 attempts per 15 minutes in production, 100 in development
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true, 
  legacyHeaders: false,
});