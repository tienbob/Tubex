import { app, logger } from './app';
import { config } from './config';
import { connectDatabases, AppDataSource } from './database';

const PORT = config.port || 3001;

const startServer = async () => {
  try {
    // Connect to databases - critical for application functionality
    try {
      await connectDatabases();
      
      // Verify PostgreSQL connection is active
      if (!AppDataSource.isInitialized) {
        throw new Error('PostgreSQL database connection failed to initialize');
      }
      
      // Verify that critical entities are properly registered
      try {
        const entityNames = AppDataSource.entityMetadatas.map(metadata => metadata.name);
        logger.info(`Registered entities: ${entityNames.join(', ')}`);
        
        // Check for essential entities
        const requiredEntities = ['User', 'Company', 'Product', 'Order'];
        const missingEntities = requiredEntities.filter(entity => !entityNames.includes(entity));
        
        if (missingEntities.length > 0) {
          throw new Error(`Missing required entities: ${missingEntities.join(', ')}`);
        }
      } catch (entityError) {
        logger.error('Entity registration error:', entityError);
        throw entityError;
      }
    } catch (dbError) {
      logger.error('Critical database connection error:', dbError);
      
      // Only continue in development mode with proper warning
      if (config.nodeEnv === 'development') {
        logger.warn('⚠️ WARNING: Starting server without database connection. Most functionality will NOT work!');
        console.warn('\n⚠️ DATABASE CONNECTION FAILED! Application will have limited functionality.\n');
      } else {
        // In production, database connection is mandatory
        logger.error('Cannot start server without database connection in production mode');
        process.exit(1);
      }
    }
    
    // Start the server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT} in ${config.nodeEnv} mode`);
      console.log(`Server is listening on http://localhost:${PORT}`);
      
      if (config.nodeEnv === 'development') {
        console.log(`
----------------------------------------
🚀 API Documentation available at:
   http://localhost:${PORT}/api-docs
----------------------------------------
💻 Development server:
   Health check: http://localhost:${PORT}/api/v1/health
----------------------------------------
        `);
      }
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', error);
  console.error('STACK TRACE:', error.stack);
  // In development, don't exit immediately so we can see the error
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', JSON.stringify(promise));
  console.error('REASON:', reason);
  
  // If reason is an Error, log its stack trace
  if (reason instanceof Error) {
    console.error('DETAILED ERROR:', reason);
    console.error('STACK TRACE:', reason.stack);
  }
  
  // In development, don't exit immediately so we can see the error
  if (config.nodeEnv === 'production') {
    process.exit(1);
  }
});

startServer();