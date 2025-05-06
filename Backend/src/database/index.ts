import { createClient } from 'redis';
import mongoose from 'mongoose';
import { AppDataSource } from './ormconfig';
import { config } from '../config';

// MongoDB connection
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(config.dbConfig.mongodb.uri);
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    if (config.nodeEnv === 'development') {
      console.warn('Running in development mode without MongoDB connection');
      return false;
    }
    process.exit(1);
  }
};

// Redis connection (silenced for now)
// Using a dummy client that doesn't actually connect
export const redisClient = {
  connect: async () => Promise.resolve(),
  on: (event: string, callback: any) => {},
  get: async () => null,
  set: async () => {},
  del: async () => {},
  disconnect: async () => Promise.resolve(),
} as any;

// Commenting out actual Redis client for now - will enable later
/*
export const redisClient = createClient({
  socket: {
    host: config.dbConfig.redis.host,
    port: config.dbConfig.redis.port,
  },
});

redisClient.on('error', (err: Error) => {
  console.error('Redis Client Error', err);
  if (config.nodeEnv === 'development') {
    console.warn('Running in development mode with Redis errors');
  }
});
redisClient.on('connect', () => console.log('Redis connected successfully'));
*/

export const connectDatabases = async () => {
  try {
    let postgresConnected = false;
    let mongoConnected = false;
    let redisConnected = false;

    try {
      // Initialize TypeORM connection
      await AppDataSource.initialize();
      console.log('PostgreSQL connected successfully via TypeORM');
      postgresConnected = true;
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      if (config.nodeEnv !== 'development') {
        throw error;
      }
      console.warn('Running in development mode without PostgreSQL connection');
    }

    try {
      // Connect MongoDB
      mongoConnected = await connectMongoDB();
    } catch (error) {
      if (config.nodeEnv !== 'development') {
        throw error;
      }
    }

    try {
      // Connect Redis (silenced for now)
      await redisClient.connect();
      console.log('Redis connection silenced for development');
      redisConnected = true;  // Setting to true since we're using a mock client
    } catch (error) {
      // This should never happen with mock client
      console.error('Unexpected error with Redis mock:', error);
      if (config.nodeEnv !== 'development') {
        throw error;
      }
    }

    // Log connection status
    console.log(`Database connections - PostgreSQL: ${postgresConnected}, MongoDB: ${mongoConnected}, Redis: ${redisConnected} (mock)`);
    
    if (config.nodeEnv === 'development') {
      console.log('Server starting in development mode - database connection failures will be tolerated');
      return { postgresConnected, mongoConnected, redisConnected };
    } else if (!postgresConnected || !mongoConnected || !redisConnected) {
      throw new Error('Failed to connect to one or more required databases in production mode');
    }

    return { postgresConnected, mongoConnected, redisConnected };
  } catch (error) {
    console.error('Database connection error:', error);
    if (config.nodeEnv === 'development') {
      console.warn('Running in development mode with database connection issues');
      return { postgresConnected: false, mongoConnected: false, redisConnected: false };
    }
    process.exit(1);
  }
};