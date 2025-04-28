# Technical Design Document (TDD)
# Tubex - B2B SaaS Platform for Construction Materials

## 1. System Architecture

### 1.1 High-Level Architecture
```
[Client Applications] → [Load Balancer] → [API Gateway] → [Microservices] → [Databases]
```

### 1.2 Technology Stack
- **Frontend:**
  - Web Application: React.js
  - Mobile Application: React Native
  - State Management: Redux
  - UI Framework: Material-UI/Ant Design
  
- **Backend:**
  - Primary Framework: Node.js (16+) with Express.js
  - Language: TypeScript 4.9+
  - API Documentation: Swagger/OpenAPI 3.0
  - Authentication: JWT + OAuth2.0 (Google, Facebook)
  
- **Databases:**
  - Primary Database: PostgreSQL 14
  - Cache Layer: Redis 7
  - Document Store: MongoDB 6
  
- **DevOps:**
  - Cloud Provider: AWS/Viettel Cloud
  - CI/CD: Jenkins/GitHub Actions
  - Containerization: Docker
  - Container Orchestration: Kubernetes
  
- **Integration Services:**
  - Email: AWS SES
  - Payment: VNPay/Momo
  - Messaging: Zalo API
  - Push Notifications: Firebase

## 2. Database Design

### 2.1 Database Schema
#### Users and Authentication
```sql
-- Companies (Dealers/Suppliers)
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type company_type NOT NULL,
    subscription_tier subscription_tier NOT NULL DEFAULT 'free',
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    company_id UUID REFERENCES companies(id),
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Enums
CREATE TYPE company_type AS ENUM ('dealer', 'supplier');
CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');
CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
```

#### Product Management
```sql
-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    supplier_id UUID REFERENCES companies(id),
    status VARCHAR(50) NOT NULL DEFAULT 'active',
    created_at TIMESTAMP NOT NULL DEFAULT now(),
    updated_at TIMESTAMP NOT NULL DEFAULT now()
);

-- Add appropriate indexes
CREATE INDEX "idx_products_supplier" ON "products"("supplier_id");
```

#### Order Management
```sql
-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    status VARCHAR(50),
    total_amount DECIMAL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID,
    product_id UUID,
    quantity DECIMAL,
    unit_price DECIMAL,
    created_at TIMESTAMP
);
```

### 2.2 Data Migration Strategy
1. Initial Data Import
2. Incremental Updates
3. Rollback Procedures

## 3. API Design

### 3.1 RESTful API Endpoints

#### Authentication
```
# Basic Authentication
POST /api/v1/auth/register       # Register new user and company
POST /api/v1/auth/login          # Login with email/password
POST /api/v1/auth/refresh-token  # Refresh access token
POST /api/v1/auth/forgot-password # Request password reset
POST /api/v1/auth/reset-password # Reset password with token

# OAuth Authentication
GET  /api/v1/auth/google        # Initiate Google OAuth
GET  /api/v1/auth/google/callback # Google OAuth callback
GET  /api/v1/auth/facebook      # Initiate Facebook OAuth
GET  /api/v1/auth/facebook/callback # Facebook OAuth callback
```

#### User Management
```
GET /api/v1/users
POST /api/v1/users
PUT /api/v1/users/{id}
DELETE /api/v1/users/{id}
```

#### Product Management
```
GET /api/v1/products
POST /api/v1/products
PUT /api/v1/products/{id}
DELETE /api/v1/products/{id}
```

#### Order Management
```
GET /api/v1/orders
POST /api/v1/orders
PUT /api/v1/orders/{id}
GET /api/v1/orders/{id}/items
```

### 3.2 API Security
1. JWT Authentication
2. Rate Limiting
3. Input Validation
4. CORS Policy

## 4. Frontend Architecture

### 4.1 Component Structure
```
src/
├── components/
│   ├── common/
│   ├── forms/
│   ├── layout/
│   └── specific/
├── pages/
├── services/
├── store/
└── utils/
```

### 4.2 State Management
1. Redux Store Structure
2. Action Creators
3. Reducers
4. Middleware

## 5. Security Implementation

### 5.1 Authentication Flow
1. JWT Token Generation
   - Access token (15 minutes)
   - Refresh token (7 days)
   - Redis storage for refresh tokens
2. OAuth2.0 Integration
   - Google authentication
   - Facebook authentication
3. Password Security
   - Bcrypt hashing (12 rounds)
   - Password reset via email
4. Session Management
   - Redis-based token storage
   - Token invalidation on logout/reset

### 5.2 Authorization
1. Role-Based Access Control (RBAC)
   - User roles: admin, manager, staff
   - Company types: dealer, supplier
2. Permission Matrix
3. API Gateway Security
   - Rate limiting with Redis
   - Input validation with Joi
   - CORS policy

### 5.3 Data Security
1. Data Encryption at Rest
2. SSL/TLS Implementation
3. Database Security
   - Connection pooling
   - Prepared statements
   - Parameterized queries

## 6. Performance Optimization

### 6.1 Caching Strategy
1. Redis Implementation
   - Token storage
   - Rate limiting
   - General-purpose caching
2. Cache Invalidation
   - Time-based expiry
   - Event-based invalidation
3. Cache Layers
   - Application-level caching
   - Database query caching
   - API response caching

### 6.2 Database Optimization
1. Indexing Strategy
2. Query Optimization
3. Connection Pooling

### 6.3 Frontend Optimization
1. Code Splitting
2. Lazy Loading
3. Asset Optimization

## 7. Monitoring and Logging

### 7.1 Application Monitoring
1. Performance Metrics
2. Error Tracking
3. User Analytics

### 7.2 Logging Strategy
1. Log Levels
2. Log Storage
3. Log Analysis

## 8. Deployment Strategy

### 8.1 Development Environment
1. Local Setup
2. Docker Compose
3. Development Database

### 8.2 Staging Environment
1. AWS/Viettel Cloud Setup
2. CI/CD Pipeline
3. Testing Infrastructure

### 8.3 Production Environment
1. Kubernetes Clusters
2. Load Balancing
3. Database Replication

## 9. Testing Strategy

### 9.1 Unit Testing
1. Frontend Tests (Jest)
2. Backend Tests (Mocha/Chai)
3. Coverage Requirements

### 9.2 Integration Testing
1. API Testing
2. Service Integration
3. Database Integration

### 9.3 End-to-End Testing
1. User Flows
2. Performance Testing
3. Security Testing

## 10. Disaster Recovery

### 10.1 Backup Strategy
1. Database Backups
2. File Storage Backups
3. Configuration Backups

### 10.2 Recovery Procedures
1. Database Recovery
2. System Recovery
3. Data Restoration

## 11. Implementation Timeline

### Phase 1: MVP (May-Oct 2025)
1. Core Backend Services
2. Basic Frontend
3. Essential Database Structure

### Phase 2: Growth (Nov 2025-Apr 2026)
1. Advanced Features
2. Integration Services
3. Performance Optimization

### Phase 3: Scale (2026-2028)
1. AI/ML Implementation
2. IoT Integration
3. Enhanced Security

## 12. Technical Dependencies

### 12.1 External Services
1. Payment Gateways
2. Cloud Services
3. Third-party APIs

### 12.2 Internal Dependencies
1. Service Dependencies
2. Library Dependencies
3. Tool Dependencies

## 13. Approval and Sign-off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Technical Lead | _____________ | ________ | _________ |
| System Architect | _____________ | ________ | _________ |
| Security Lead | _____________ | ________ | _________ |
| DevOps Lead | _____________ | ________ | _________ |