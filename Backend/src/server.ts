import { app, logger } from './app';
import { config } from './config';
import { connectDatabases } from './database';

const PORT = config.port || 3001;

const startServer = async () => {
  try {
    // Try to connect to databases, but continue even if they fail
    try {
      await connectDatabases();
    } catch (dbError) {
      logger.warn('Database connection issues, continuing in development mode:', dbError);
    }
    
    // Start the server regardless of database connection status
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