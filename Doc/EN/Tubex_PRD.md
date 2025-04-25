# Tubex - B2B SaaS Platform for Construction Materials

## 1. Project Overview

### 1.1 Executive Summary
- **Project Name:** Tubex
- **Type:** B2B SaaS Platform
- **Target Market:** Construction materials dealers (steel, pipes, accessories)
- **Core Features:** Sales management, inventory, accounting, procurement with AI integration

### 1.2 Scope
- **Users:** Dealers, staff, company employees (accounting, admin), system admin
- **System Model:** Multi-tenant architecture
- **Business Model:**
  - Free tier (basic features)
  - Paid tier (80,000-500,000 VND/month) for dealers
  - Supplier tier (1-2M VND/month, future phase)

### 1.3 Technology Stack
- Backend: NodeJS
- Frontend: ReactJS, React Native
- Database: PostgreSQL, MongoDB
- Cache: Redis
- Cloud: AWS/Viettel Cloud
- Integrations: Zalo Mini App, VNPay/Momo, Google Firebase

### 1.4 Development Phases
1. **MVP (May-Oct 2025)**
   - Core features for dealers
   - Single supplier support
2. **Phase 2 (Nov 2025-Apr 2026)**
   - Multi-supplier support
3. **Phase 3 (2026-2028)**
   - Ecosystem expansion
   - Target: 50 suppliers, 5,000 dealers

## 2. Core Features

### 2.1 Dealer Features

#### 2.1.1 Sales Management
- Quotation generation
- Invoice and contract management
- Multi-channel order management
- KPIs and performance tracking

#### 2.1.2 Inventory Management
- Product batch tracking
- Real-time stock monitoring
- Multi-warehouse support
- Inventory alerts

#### 2.1.3 Customer Management
- Customer profiles
- Loyalty programs
- Communication tools (SMS/Zalo)

#### 2.1.4 Staff Management
- Role-based access control
- Activity tracking
- Performance reports

### 2.2 AI Features
- Demand prediction
- Smart pricing suggestions
- Zalo chatbot integration

### 2.3 Pre-order System
- Advance ordering
- Bulk purchase discounts
- Order scheduling

## 3. Non-Functional Requirements

### 3.1 Performance
- 1,000 concurrent users
- Page load < 2 seconds
- API response < 500ms

### 3.2 Security
- SSL encryption
- Two-factor authentication
- Data isolation
- Audit logging

### 3.3 Scalability
- Support for 3,000-5,000 dealers
- Cloud auto-scaling
- Open API support

## 4. Implementation Plan

### 4.1 MVP Phase (May-Oct 2025)
- Budget: 700-1,000M VND
- Target: 500 dealers
- Core features implementation

### 4.2 Growth Phase (Nov 2025-Apr 2026)
- Multi-supplier expansion
- API integrations
- Enhanced features

### 4.3 Scale Phase (2026-2028)
- AI/ML capabilities
- IoT integration
- B2B marketplace features

## 5. Risk Management

| Risk | Mitigation |
|------|------------|
| Complex UI | Simplified forms, video tutorials |
| Data sync issues | Redis caching, API monitoring |
| Security concerns | Regular audits, encryption |
| User adoption | Free data migration, training |

## 6. Success Metrics
- User adoption rate: 500 dealers (Year 1)
- System uptime: 99.9%
- User satisfaction: 95%
- Revenue target: 5-7B VND/year by 2028