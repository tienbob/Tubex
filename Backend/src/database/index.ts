import { createClient } from 'redis';
import mongoose from 'mongoose';
import { AppDataSource } from './ormconfig';
import { config } from '../config';

// Re-export AppDataSource so it can be imported from './database'
export { AppDataSource };

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

// Commenting out dummy Redis client - using real client instead
/*
export const redisClient = {
  connect: async () => Promise.resolve(),
  on: (event: string, callback: any) => {},
  get: async () => null,
  set: async () => {},
  del: async () => {},
  disconnect: async () => Promise.resolve(),
} as any;
*/

// Using actual Redis client
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

export const connectDatabases = async () => {
  try {
    let postgresConnected = false;
    let mongoConnected = false;
    let redisConnected = false;

    try {
      // Initialize TypeORM connection
      if (AppDataSource.isInitialized) {
        console.log('PostgreSQL connection already initialized');
        postgresConnected = true;
      } else {
        // Force TypeORM to load all entity metadata before initializing
        console.log('Loading entity metadata before connecting...');
        
        // Initialize TypeORM with explicit entities
        await AppDataSource.initialize();
        
        // Verify entities were properly loaded
        const entityNames = AppDataSource.entityMetadatas.map(metadata => metadata.name);
        console.log('Registered entities:', entityNames);
        
        // Verify User entity specifically
        if (!entityNames.includes('User')) {
          throw new Error('User entity metadata not registered properly');
        }
        
        console.log('PostgreSQL connected successfully via TypeORM');
        postgresConnected = true;
      }
    } catch (error) {
      console.error('PostgreSQL connection error:', error);
      if (config.nodeEnv !== 'development') {
        throw error;
      }
      console.warn('Running in development mode without PostgreSQL connection');
    }

    // Add connection monitoring for TypeORM
    if (postgresConnected) {
      // Set up a periodic connection check
      const connectionCheckInterval = setInterval(async () => {
        try {
          // Simple query to verify connection is alive
          if (AppDataSource.isInitialized) {
            await AppDataSource.query('SELECT 1');
          }
        } catch (err) {
          console.error('PostgreSQL connection check failed:', err);
          try {
            if (AppDataSource.isInitialized) {
              await AppDataSource.destroy();
            }
            await AppDataSource.initialize();
            console.log('PostgreSQL connection restored successfully');
          } catch (reconnectError) {
            console.error('Failed to reconnect to PostgreSQL:', reconnectError);
          }
        }
      }, 30000); // Check every 30 seconds
      
      // Clean up on process exit
      process.on('SIGINT', () => {
        clearInterval(connectionCheckInterval);
        process.exit(0);
      });
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
      // Connect Redis
      await redisClient.connect();
      console.log('Redis connected successfully');
      redisConnected = true;
    } catch (error) {
      console.error('Redis connection error:', error);
      if (config.nodeEnv !== 'development') {
        throw error;
      }
      console.warn('Running in development mode without Redis connection');
    }

    // Log connection status
    console.log(`Database connections - PostgreSQL: ${postgresConnected}, MongoDB: ${mongoConnected}, Redis: ${redisConnected}`);
    
    if (config.nodeEnv === 'development') {
      // Even in development mode, PostgreSQL is essential for core functionality
      if (!postgresConnected) {
        console.warn('WARNING: PostgreSQL is not connected. Core functionality will not work properly.');
      }
      return { postgresConnected, mongoConnected, redisConnected };
    } else if (!postgresConnected || !mongoConnected || !redisConnected) {
      throw new Error('Failed to connect to one or more required databases in production mode');
    }

    return { postgresConnected, mongoConnected, redisConnected };
  } catch (error) {
    console.error('Database connection error:', error);
    throw error; // Rethrow to allow server.ts to handle it appropriately
  }
};