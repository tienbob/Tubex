import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import passport from 'passport';
import winston from 'winston';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { swaggerSpec } from './config/swagger';
import { authRoutes } from './services/auth/routes';
import { userRoutes } from './services/user/routes';
import { productRoutes } from './services/product/routes';
import { productCategoryRoutes } from './services/product/category-routes';
import { orderRoutes } from './services/order/routes';
import { inventoryRoutes } from './services/inventory/routes';
import { userManagementRoutes } from './services/user-management/routes';
import { warehouseRoutes } from './services/warehouse/routes';
import { companyVerificationRoutes } from './services/company-verification/routes';
import { companyRoutes } from './services/company/routes';
import { errorHandler } from './middleware/errorHandler';
import compression from 'compression';
import { rateLimiter } from './middleware/rateLimiter';
import { quoteRoutes } from './services/quote/routes';
import { paymentRoutes } from './services/payment/routes';
import { invoiceRoutes } from './services/invoice/routes';
import { batchRoutes } from './services/batch/routes';

// Configure logger
export const logger = winston.createLogger({
  level: config.nodeEnv === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

// Create Express application
export const app = express();

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json());
app.use(passport.initialize());
app.use(rateLimiter);

// Root endpoint for basic connectivity testing
app.get('/', (_req: Request, res: Response) => {
  res.status(200).send('Tubex API is running');
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  logger.info(`${req.method} ${req.url}`, {
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  next();
});

// Routes
app.use('/api/v1/auth', authRoutes);
app.use('/v1/auth', authRoutes); // Support alternative path format
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/companies', companyRoutes); // New company management routes
app.use('/api/v1/company/manage', userManagementRoutes); // New user management routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/companies/:companyId/product-categories', productCategoryRoutes); // New product categories route
app.use('/api/v1/warehouses', warehouseRoutes); // New warehouse management routes
app.use('/api/v1/orders', orderRoutes);
app.use('/api/v1/inventory', inventoryRoutes);
app.use('/api/v1/batches', batchRoutes); // New batch management routes
app.use('/api/v1/quotes', quoteRoutes); // New quote management routes
app.use('/api/v1/payments', paymentRoutes); // New payment management routes
app.use('/api/v1/invoices', invoiceRoutes); // New invoice management routes
app.use('/api/v1/company-verification', companyVerificationRoutes);
app.use('/api/v1/batch', batchRoutes); // New batch processing routes

// API version health check endpoint
app.get('/api/v1/health', (_req: Request, res: Response) => {
  res.status(200).json({ 
    status: 'healthy',
    environment: config.nodeEnv,
    timestamp: new Date().toISOString()
  });
});

// Add after routes are registered
console.log('Available routes:');
app._router.stack.forEach((middleware: any) => {
  if (middleware.route) {
    // Routes registered directly
    console.log(`${Object.keys(middleware.route.methods).join(', ')} ${middleware.route.path}`);
  } else if (middleware.name === 'router') {
    // Router middleware
    middleware.handle.stack.forEach((handler: any) => {
      if (handler.route) {
        const path = handler.route.path;
        const methods = Object.keys(handler.route.methods).join(', ');
        console.log(`${methods.toUpperCase()} ${middleware.regexp} ${path}`);
      }
    });
  }
});

// Error handling
app.use(errorHandler);