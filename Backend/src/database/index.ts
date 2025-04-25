import { createClient } from 'redis';
import mongoose from 'mongoose';
import { AppDataSource } from './ormconfig';
import { config } from '../config';

// MongoDB connection
export const connectMongoDB = async () => {
  try {
    await mongoose.connect(config.dbConfig.mongodb.uri);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

// Redis connection
export const redisClient = createClient({
  socket: {
    host: config.dbConfig.redis.host,
    port: config.dbConfig.redis.port,
  },
});

redisClient.on('error', (err: Error) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis connected successfully'));

export const connectDatabases = async () => {
  try {
    // Initialize TypeORM connection
    await AppDataSource.initialize();
    console.log('PostgreSQL connected successfully via TypeORM');

    // Connect MongoDB
    await connectMongoDB();

    // Connect Redis
    await redisClient.connect();
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
};