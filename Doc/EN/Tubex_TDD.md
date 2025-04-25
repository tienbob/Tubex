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
  - Primary Framework: Node.js with Express.js
  - API Documentation: Swagger/OpenAPI
  - Authentication: JWT, OAuth2.0
  
- **Databases:**
  - Primary Database: PostgreSQL
  - Cache Layer: Redis
  - Document Store: MongoDB (for unstructured data)
  
- **DevOps:**
  - Cloud Provider: AWS/Viettel Cloud
  - CI/CD: Jenkins/GitHub Actions
  - Containerization: Docker
  - Container Orchestration: Kubernetes
  
- **Integration Services:**
  - Payment: VNPay/Momo
  - Messaging: Zalo API
  - Push Notifications: Firebase
  - Email Service: AWS SES/SendGrid

## 2. Database Design

### 2.1 Database Schema
#### Users and Authentication
```sql
-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) UNIQUE,
    password_hash VARCHAR(255),
    role VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Companies (Dealers/Suppliers)
CREATE TABLE companies (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    type VARCHAR(50),
    subscription_tier VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Product Management
```sql
-- Products
CREATE TABLE products (
    id UUID PRIMARY KEY,
    name VARCHAR(255),
    category_id UUID,
    supplier_id UUID,
    unit VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Inventory
CREATE TABLE inventory (
    id UUID PRIMARY KEY,
    product_id UUID,
    warehouse_id UUID,
    quantity DECIMAL,
    unit_price DECIMAL,
    batch_number VARCHAR(255),
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

#### Order Management
```sql
-- Orders
CREATE TABLE orders (
    id UUID PRIMARY KEY,
    customer_id UUID,
    status VARCHAR(50),
    total_amount DECIMAL,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);

-- Order Items
CREATE TABLE order_items (
    id UUID PRIMARY KEY,
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
POST /api/v1/auth/login
POST /api/v1/auth/register
POST /api/v1/auth/refresh-token
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
2. Refresh Token Mechanism
3. Password Hashing (bcrypt)
4. Session Management

### 5.2 Authorization
1. Role-Based Access Control (RBAC)
2. Permission Matrix
3. API Gateway Security

### 5.3 Data Security
1. Data Encryption at Rest
2. SSL/TLS Implementation
3. Database Security

## 6. Performance Optimization

### 6.1 Caching Strategy
1. Redis Implementation
2. Cache Invalidation
3. Cache Layers

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