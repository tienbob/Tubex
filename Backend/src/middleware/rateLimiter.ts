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
      // Make sure we're properly handling Redis commands
      sendCommand: async (...args: string[]) => {
        try {
          if (!redisClient || typeof redisClient.sendCommand !== 'function') {
            throw new Error('Redis client not properly initialized');
          }
          return await redisClient.sendCommand(args);
        } catch (error) {
          console.error('Redis command error:', error);
          return null; // Return null to allow operation without Redis
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
  max: 100, // limit each IP to 100 requests per minute
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter - stricter limits for auth endpoints
export const authLimiter = rateLimit({
  store: getRateLimitStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs for auth endpoints
  message: 'Too many authentication attempts, please try again later',
  standardHeaders: true, 
  legacyHeaders: false,
});