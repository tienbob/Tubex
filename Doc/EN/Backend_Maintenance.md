# Maintenance Documentation for Tubex Backend

## Overview
This document provides guidelines and best practices for maintaining the Tubex Backend system. It includes instructions for setup, troubleshooting, updating, and understanding the purpose and functionality of each component.

---

## 1. Prerequisites

### 1.1 Required Tools
- **Node.js**: Version 16 or higher
- **TypeScript**: Installed globally (`npm install -g typescript`)
- **Docker**: For containerized services
- **PostgreSQL**, **MongoDB**, and **Redis**: Installed locally or accessible via Docker
- **AWS Account**: For SES email service
- **OAuth Credentials**: Google and Facebook developer accounts
- **Payment Gateway Access**: VNPay and Momo accounts
- **Nodemon**: For development (`npm install -g nodemon`)

### 1.2 Environment Variables
Configure the following in your `.env` file:

#### Server Configuration
- `PORT`: Server port (default: 3000)
- `NODE_ENV`: Environment (development/production)
- `BASE_URL`: Backend base URL
- `FRONTEND_URL`: Frontend application URL

#### Database Configuration
- `POSTGRES_HOST`: PostgreSQL host
- `POSTGRES_PORT`: PostgreSQL port
- `POSTGRES_DB`: Database name
- `POSTGRES_USER`: Database user
- `POSTGRES_PASSWORD`: Database password
- `MONGODB_URI`: MongoDB connection URI
- `REDIS_HOST`: Redis host
- `REDIS_PORT`: Redis port

#### Authentication
- `JWT_SECRET`: Secret for JWT tokens
- `JWT_EXPIRES_IN`: Token expiration time

#### OAuth Configuration
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `FACEBOOK_APP_ID`: Facebook OAuth app ID
- `FACEBOOK_APP_SECRET`: Facebook OAuth app secret

#### AWS Configuration
- `AWS_REGION`: AWS region for services
- `AWS_ACCESS_KEY_ID`: AWS access key
- `AWS_SECRET_ACCESS_KEY`: AWS secret key
- `EMAIL_FROM`: Default sender email for SES

#### Payment Gateways
- `VNPAY_MERCHANT_ID`: VNPay merchant ID
- `VNPAY_SECURE_SECRET`: VNPay secure secret
- `MOMO_PARTNER_CODE`: Momo partner code
- `MOMO_ACCESS_KEY`: Momo access key
- `MOMO_SECRET_KEY`: Momo secret key

#### Additional Services
- `ZALO_APP_ID`: Zalo messaging app ID
- `ZALO_SECRET_KEY`: Zalo messaging secret key
- `FIREBASE_PROJECT_ID`: Firebase project ID
- `FIREBASE_PRIVATE_KEY`: Firebase private key
- `FIREBASE_CLIENT_EMAIL`: Firebase client email

---

## 2. Setup Instructions

### 2.1 Local Development
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Fill in all required variables
4. Start the database services:
   ```bash
   docker-compose up -d
   ```
5. Run database migrations:
   ```bash
   npm run typeorm migration:run
   ```
6. Start the development server:
   ```bash
   npm run dev
   ```

### 2.2 Production Setup
1. Build the project:
   ```bash
   npm run build
   ```
2. Start the server:
   ```bash
   npm start
   ```

---

## 3. Component Overview

### 3.1 `server.ts`
- **Purpose**: Entry point of the application. Configures middleware, routes, and starts the server.
- **Key Functions**:
  - Initializes Express app.
  - Configures global middleware (e.g., error handling).
  - Loads routes from `src/services`.

### 3.2 `src/config/index.ts`
- **Purpose**: Centralized configuration management.
- **Key Functions**:
  - Reads environment variables.
  - Exports configuration objects for use across the application.

### 3.3 `src/database`
- **Purpose**: Manages database connections and migrations.
- **Key Components**:
  - `index.ts`: Initializes connections to PostgreSQL and MongoDB.
  - `ormconfig.ts`: TypeORM configuration for SQL database.
  - `migrations/`: Contains database migration scripts.
  - `models/`: Defines data models for MongoDB and SQL.

### 3.4 `src/middleware/errorHandler.ts`
- **Purpose**: Centralized error handling middleware.
- **Key Functions**:
  - Captures and formats errors.
  - Sends appropriate HTTP responses.

### 3.5 `src/services`
- **Purpose**: Contains business logic and API routes.
- **Key Services**:
  - **Auth**:
    - `controller.ts`: Handles authentication logic (e.g., login, signup).
    - `routes.ts`: Defines authentication-related API endpoints.
    - `validators.ts`: Validates input for authentication endpoints.
  - **Inventory**:
    - `routes.ts`: Manages inventory-related API endpoints.
  - **Order**:
    - `routes.ts`: Handles order-related API endpoints.
  - **Product**:
    - `routes.ts`: Manages product-related API endpoints.

---

## 4. Troubleshooting

### 4.1 Common Issues
- **Database Connection Errors**:
  - Ensure PostgreSQL, MongoDB, and Redis are running.
  - Verify `.env` configuration.
  - Check network connectivity and firewall settings.
  - Verify database user permissions.
  - Common error codes and solutions:
    - ECONNREFUSED: Check if database service is running
    - Authentication failed: Verify credentials in .env
    - Too many connections: Check connection pool settings

- **TypeScript Compilation Errors**:
  - Run `npm run build` to identify issues.
  - Check `tsconfig.json` for misconfigurations.
  - Common fixes:
    - Clear the dist folder: `rm -rf dist`
    - Delete node_modules: `rm -rf node_modules && npm install`
    - Check TypeScript version compatibility

- **Docker Issues**:
  - Run `docker-compose logs` to debug container issues.
  - Common docker commands:
    ```bash
    # Restart all services
    docker-compose down && docker-compose up -d
    
    # Check container status
    docker-compose ps
    
    # View real-time logs
    docker-compose logs -f
    ```

- **Memory Issues**:
  - Check Node.js heap usage: `node --inspect`
  - Monitor container memory: `docker stats`
  - Adjust Node.js memory limit: `NODE_OPTIONS="--max-old-space-size=4096"`

### 4.2 Logs and Monitoring
- Application logs location:
  - Error logs: `/logs/error.log`
  - Combined logs: `/logs/combined.log`
  - Access logs: `/logs/access.log`
- Log rotation policy:
  - Daily rotation
  - Keep last 14 days
  - Max size: 50MB per file
- Log monitoring tools:
  - Use `winston` for application logging
  - ELK Stack integration (optional)
  - Log levels: error, warn, info, debug

### 4.3 Performance Optimization
- Database Optimization:
  - Regular VACUUM for PostgreSQL
  - Index optimization
  - Query performance monitoring
- Caching Strategy:
  - Redis caching for:
    - User sessions
    - API responses
    - Frequently accessed data
  - Cache invalidation rules
- Rate Limiting:
  - Default: 100 requests per minute
  - Configurable per endpoint
  - IP-based and token-based limiting

## 5. Backup and Recovery

### 5.1 Database Backup
- PostgreSQL:
  ```bash
  # Daily automated backup
  pg_dump -U username -d dbname > backup_$(date +%Y%m%d).sql
  
  # Restore from backup
  psql -U username -d dbname < backup_file.sql
  ```
- MongoDB:
  ```bash
  # Backup
  mongodump --uri="mongodb://username:password@host:port/dbname"
  
  # Restore
  mongorestore --uri="mongodb://username:password@host:port/dbname" dump/
  ```

### 5.2 Environment Backup
- Configuration files:
  - Regular backup of .env files
  - Secure storage of credentials
  - Version control for config templates
- Document storage:
  - AWS S3 bucket backup
  - Regular sync of uploaded files

### 5.3 Disaster Recovery
- Recovery Time Objective (RTO): 4 hours
- Recovery Point Objective (RPO): 24 hours
- Recovery procedures:
  1. Restore latest database backup
  2. Verify data integrity
  3. Restore configuration
  4. Validate system functionality

## 6. Security Measures

### 6.1 Access Control
- Role-based access control (RBAC)
- IP whitelisting for admin access
- Two-factor authentication for critical operations
- Regular access audit

### 6.2 Data Protection
- Data encryption at rest
- SSL/TLS for data in transit
- Regular security updates
- PCI DSS compliance measures

### 6.3 Monitoring and Alerts
- System metrics monitoring:
  - CPU usage
  - Memory usage
  - Disk space
  - Network traffic
- Alert thresholds:
  - CPU > 80%
  - Memory > 85%
  - Disk space > 90%
  - Response time > 2s
- Alert channels:
  - Email notifications
  - Slack integration
  - SMS for critical alerts

## 7. Scheduled Maintenance

### 7.1 Daily Tasks
- Log rotation
- Backup verification
- Health check monitoring

### 7.2 Weekly Tasks
- Security updates
- Performance analysis
- Error log review

### 7.3 Monthly Tasks
- Full system backup
- Security audit
- Performance optimization
- Dependency updates

## 8. Documentation Updates
- Maintain changelog
- Update API documentation
- Record system modifications
- Document configuration changes

## 9. Support Contacts

### 9.1 Primary Contacts
- System Administrator: [Contact Info]
- Database Administrator: [Contact Info]
- Security Team: [Contact Info]

### 9.2 Escalation Path
1. Level 1: Development Team
2. Level 2: System Administrator
3. Level 3: Technical Lead
4. Level 4: CTO

### 9.3 External Support
- AWS Support
- Database vendor support
- Payment gateway support
- Third-party service providers