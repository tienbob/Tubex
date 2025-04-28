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
- **TypeScript Compilation Errors**:
  - Run `npm run build` to identify issues.
  - Check `tsconfig.json` for misconfigurations.
- **Docker Issues**:
  - Run `docker-compose logs` to debug container issues.

### 4.2 Logs
- Application logs are stored in `error.log` and `combined.log`.
- Use `winston` for detailed logging.

---

## 5. Updating the System

### 5.1 Dependency Updates
1. Check for outdated dependencies:
   ```bash
   npm outdated
   ```
2. Update dependencies:
   ```bash
   npm update
   ```

### 5.2 Database Migrations
1. Generate a new migration:
   ```bash
   npm run typeorm migration:generate -- -n <MigrationName>
   ```
2. Run migrations:
   ```bash
   npm run typeorm migration:run
   ```

### 5.3 Adding New Features
- Follow the existing folder structure.
- Add new routes under `src/services`.
- Update `server.ts` to include new routes.

---

## 6. Best Practices

### 6.1 Code Quality
- Use `eslint` to lint code:
  ```bash
  npm run lint
  ```
- Follow TypeScript best practices.

### 6.2 Security
- Rotate secrets in `.env` regularly.
- Use strong passwords for database services.
- Enable SSL/TLS for production environments.

### 6.3 Performance
- Use Redis for caching frequently accessed data.
- Optimize database queries with indexing.
- Monitor API performance using tools like Postman or New Relic.

---

## 7. Monitoring and Maintenance

### 7.1 Health Checks
- Use the `/health` endpoint to verify server status.

### 7.2 Monitoring Tools
- **Docker**: Monitor container health.
- **Database Tools**: Use pgAdmin for PostgreSQL and MongoDB Compass for MongoDB.
- **Logging**: Review logs regularly for errors.

---

## 8. Contact Information
For further assistance, contact the development team or refer to the project documentation.