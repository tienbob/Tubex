# Maintenance Documentation for Tubex Backend

## Overview
This document provides guidelines and best practices for maintaining the Tubex Backend system. It includes instructions for setup, troubleshooting, updating, and understanding the purpose and functionality of each component.

Last Updated: May 2025

## 1. Prerequisites

### 1.1 Required Tools
- **Node.js**: Version 16 or higher
- **TypeScript**: Version 4.9+
- **Docker**: Latest stable version
- **PostgreSQL**: Version 14
- **MongoDB**: Version 6
- **Redis**: Version 7
- **AWS Account**: For SES email service
- **OAuth Credentials**: Google and Facebook developer accounts
- **Payment Gateway Access**: VNPay and Momo accounts
- **Nodemon**: For development

### 1.2 Environment Variables
Configure the following in your `.env` file:

```env
NODE_ENV=development
PORT=3000
PG_HOST=localhost
PG_PORT=5432
PG_USER=postgres
PG_PASSWORD=development
PG_DATABASE=tubex
MONGO_URI=mongodb://localhost:27017/tubex
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=1d
AWS_ACCESS_KEY_ID=your_aws_access_key
AWS_SECRET_ACCESS_KEY=your_aws_secret_key
AWS_REGION=ap-southeast-1
```

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

## 2. System Components

### 2.1 Core Services (Implemented)
- **Authentication Service**: JWT-based auth with OAuth2.0
- **User Management**: CRUD operations for users and roles
- **Inventory Management**: Stock tracking and updates
- **Order Processing**: Order lifecycle management
- **Company Verification**: Business validation system
- **Email Service**: Transactional emails via AWS SES
- **Cache Layer**: Redis-based caching system

### 2.2 Services in Development
- **Warehouse Management**: Multi-location inventory
- **Product Management**: Product lifecycle and pricing
- **Analytics Engine**: Reporting and insights

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

## 3. Maintenance Procedures

### 3.1 Regular Maintenance Tasks
- Daily database backups
- Log rotation and cleanup
- Cache invalidation checks
- Performance monitoring
- Security patch updates

### 3.2 Database Maintenance
```bash
# PostgreSQL vacuum
npm run db:vacuum

# MongoDB index maintenance
npm run mongo:maintain

# Redis cache cleanup
npm run cache:clean
```

### 3.3 Monitoring
- CPU and memory usage
- API response times
- Database query performance
- Cache hit rates
- Error rates and patterns

## 4. Troubleshooting

### 4.1 Common Issues
1. **Connection Issues**
   - Check Docker container status
   - Verify database connectivity
   - Check Redis connection
   
2. **Performance Issues**
   - Monitor query execution plans
   - Check cache effectiveness
   - Review API bottlenecks

3. **Authentication Issues**
   - Verify JWT secret
   - Check OAuth configurations
   - Review user permissions

### 4.2 Logging
- Application logs: `combined.log`
- Error logs: `error.log`
- Docker logs: `docker-compose logs`

## 5. Deployment

### 5.1 Development
```bash
npm run dev
```

### 5.2 Staging
```bash
npm run build
npm run start:staging
```

### 5.3 Production
```bash
docker-compose -f docker-compose.prod.yml up -d
```

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

### 7.1 Database Backups
- Daily automated backups
- Weekly full backups
- Monthly archive backups

### 7.2 Recovery Procedures
- Point-in-time recovery
- Transaction log replay
- System state restoration

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

### 6.1 Implemented
- JWT Authentication
- Rate limiting
- Input validation
- SQL injection prevention
- XSS protection
- CORS configuration

### 6.2 Regular Security Tasks
- Dependency audits
- Code security reviews
- Access token rotation
- SSL certificate renewal
- Security patch updates

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

## 8. Performance Optimization

### 8.1 Database
- Index optimization
- Query performance tuning
- Regular VACUUM operations

### 8.2 Application
- Cache strategy review
- API response optimization
- Background job scheduling

## 8. Documentation Updates
- Maintain changelog
- Update API documentation
- Record system modifications
- Document configuration changes

Maintain and update this documentation when:
- Adding new features
- Changing configurations
- Updating dependencies
- Modifying deployment procedures
- Implementing new security measures

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