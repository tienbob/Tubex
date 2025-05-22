# Tubex - B2B SaaS Platform for Construction Materials

A scalable B2B SaaS platform built to streamline the construction materials supply chain, featuring multi-tenant architecture, real-time inventory management, and comprehensive order tracking.

## Project Overview
Tubex is a comprehensive B2B SaaS platform designed for the construction materials industry, facilitating efficient transactions between suppliers and dealers.

## 🚀 Features

- Multi-tenant architecture with dealer isolation
- Real-time inventory tracking
- Secure authentication with JWT and OAuth2.0
- Role-based access control
- Payment integration (VNPay, Momo)
- Email notifications via AWS SES
- Push notifications via Firebase
- Messaging integration with Zalo API

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js (16+)
- **Framework**: Express.js with TypeScript
- **Databases**: 
  - PostgreSQL (Primary DB)
  - MongoDB (Analytics & Logs)
  - Redis (Caching & Rate Limiting)
- **Authentication**: JWT + OAuth2.0 (Google, Facebook)
- **Documentation**: Swagger/OpenAPI 3.0

### Frontend
- **Web**: React.js
- **Mobile**: React Native
- **State Management**: Redux
- **UI Framework**: Material-UI/Ant Design

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes
- **CI/CD**: Jenkins/GitHub Actions
- **Cloud**: AWS/Viettel Cloud

## 📋 Prerequisites

- Node.js 16 or higher
- Docker and Docker Compose
- PostgreSQL 14+
- MongoDB 6+
- Redis 7+
- AWS Account (for SES)
- Payment Gateway accounts (VNPay, Momo)

## 🚦 Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   # Backend
   cd Backend
   npm install

   # Frontend
   cd ../Frontend/app
   npm install
   ```

3. Set up environment variables:
   ```bash
   # Backend
   cd Backend
   cp .env.example .env
   # Edit the .env file with your configuration values
   ```
   
   Required environment variables include:
   - Database connections (PostgreSQL, MongoDB, Redis)
   - JWT secret for authentication
   - OAuth credentials (if using Google/Facebook login)
   - AWS credentials for email service
   - Payment gateway credentials

4. Start the database services using Docker:
   ```bash
   # From Backend directory
   docker-compose up -d
   ```
   
   This will start:
   - PostgreSQL on port 5432
   - MongoDB on port 27017
   - Redis on port 6379

5. Run database migrations:
   ```bash
   # From Backend directory
   npm run typeorm migration:run
   ```

6. Start the development environment:
   ```bash
   # Start backend server
   cd Backend
   npm run dev

   # Start frontend in another terminal
   cd ../Frontend/app
   npm start
   ```

7. Access the application:
   - Backend API: http://localhost:3001/api/v1
   - API Documentation: http://localhost:3000/api-docs
   - Frontend: http://localhost:3000 (default React port)

## 🏗️ Project Structure

```
Backend/
├── src/
│   ├── app.ts         # Express application setup
│   ├── server.ts      # Application entry point
│   ├── config/        # Configuration management
│   │   ├── index.ts   # Environment configuration
│   │   ├── passport.ts # Authentication strategies
│   │   └── swagger.ts # API documentation setup
│   ├── database/
│   │   ├── index.ts   # Database connection setup
│   │   ├── ormconfig.ts # ORM configuration
│   │   ├── migrations/ # Database schema migrations
│   │   └── models/    # Data models
│   │       ├── mongo/ # MongoDB schemas (analytics, logs)
│   │       └── sql/   # SQL models (core business data)
│   ├── middleware/    # Custom middleware
│   │   ├── adminAuth.ts # Admin authentication
│   │   ├── auth.ts    # User authentication
│   │   ├── cache.ts   # Redis caching
│   │   ├── errorHandler.ts # Global error handling
│   │   ├── rateLimiter.ts # API rate limiting
│   │   └── validation.ts # Request validation
│   ├── services/      # Business logic modules
│   │   ├── auth/      # Authentication & authorization
│   │   ├── cache/     # Caching service
│   │   ├── company-verification/ # Business verification
│   │   ├── email/     # Email notifications
│   │   ├── inventory/ # Inventory management
│   │   ├── order/     # Order processing
│   │   ├── product/   # Product catalog
│   │   ├── user/      # Basic user operations
│   │   ├── user-management/ # Advanced user features
│   │   └── warehouse/ # Warehouse management
│   └── types/         # TypeScript type definitions
│       └── express.d.ts # Express type extensions
├── scripts/          # Deployment & maintenance
│   ├── docker-migrate.sh    # Container migrations
│   ├── run_warehouse_migration.bat # Windows migrations
│   ├── run_warehouse_migration.sh  # Unix migrations
│   └── run-db-migrations.sh # Database migrations
└── tests/
    ├── e2e/          # End-to-end tests
    ├── integration/  # API integration tests
    └── unit/         # Unit tests

Frontend/
└── app/
    └── src/
        ├── App.tsx           # Main application component
        ├── index.tsx         # Entry point
        ├── components/       # Reusable UI components
        │   ├── admin/       # Admin dashboard components
        │   ├── auth/        # Authentication components
        │   ├── common/      # Shared components
        │   ├── dashboard/   # User dashboard components
        │   ├── inventory/   # Inventory management UI
        │   ├── orders/      # Order management UI
        │   ├── products/    # Product catalog UI
        │   └── whitelabel/  # Multi-tenant customization
        ├── config/          # Frontend configuration
        ├── contexts/        # React context providers
        │   ├── AuthContext.tsx    # Authentication state
        │   ├── ThemeContext.tsx   # Theming state
        │   └── UserContext.tsx    # User state
        ├── hooks/           # Custom React hooks
        │   ├── useAuth.ts         # Authentication hooks
        │   ├── useForm.ts         # Form handling
        │   └── useTheme.ts        # Theming hooks
        ├── services/        # API and utility services
        │   └── api/         # Backend API clients
        │       ├── apiClient.ts      # Base API client
        │       ├── authService.ts    # Authentication API
        │       ├── companyService.ts # Company API
        │       ├── inventoryService.ts # Inventory API
        │       ├── orderService.ts   # Order API
        │       ├── productService.ts # Product API
        │       └── warehouseService.ts # Warehouse API
        ├── styles/          # Global styles and themes
        │   ├── theme/      # Theme configurations
        │   └── global.css  # Global CSS
        └── types/          # TypeScript type definitions
            ├── api.ts      # API interfaces
            ├── models.ts   # Data models
            └── utils.ts    # Utility types
```

## Current Project Status
As of May 2025:

### Backend (Node.js/TypeScript)
- ✅ Core infrastructure setup (Docker, databases)
- ✅ Authentication system with JWT and OAuth2.0
- ✅ User management with role-based access control
- ✅ Inventory management with multi-warehouse support
- ✅ Order processing and tracking system
- ✅ Company verification system
- ✅ Caching layer implementation with Redis
- ✅ Email service integration with AWS SES
- ✅ Product management system
- ✅ Warehouse management system
- 🚧 Payment gateway integration (In Progress)
- 🚧 Advanced analytics and reporting (In Progress)

### Frontend (React)
- ✅ Project scaffolding with Create React App
- ✅ Component library with Material-UI
- ✅ API service integration with Axios
- ✅ State management with Redux and Context API
- ✅ Multi-tenant theming and white-labeling
- ✅ Product management UI
- ✅ Order management interface
- ✅ Inventory management components
- ✅ Warehouse management interface
- ✅ User management dashboard
- 🚧 Reports & Analytics UI (In Progress)
- 🚧 Mobile responsiveness enhancements (In Progress)

### Infrastructure
- ✅ Docker containerization
- ✅ Database setup (PostgreSQL, MongoDB, Redis)
- ✅ Migration system
- ✅ Testing frameworks (Jest, React Testing Library)
- ✅ Error tracking and logging
- 🚧 CI/CD pipeline (In Progress)
- 🚧 Kubernetes orchestration (Planned)

## Future Roadmap

We're continuing to enhance the platform with the following features:

### Short-term (Next 3 months)
- 🔄 Advanced reporting and analytics features
- 🔄 Mobile application development with React Native
- 🔄 Payment gateway integrations (VNPay, Momo)
- 🔄 Performance optimizations and scalability enhancements

### Mid-term (Months 4-9)
- 📅 Advanced user roles and permissions
- 📅 AI-powered inventory forecasting
- 📅 Business intelligence dashboard
- 📅 Mobile app deployment to app stores

### Long-term (Beyond 9 months)
- 📅 Marketplace features connecting dealers with suppliers
- 📅 Financial services integration
- 📅 Construction project management tools
- 📅 Integration with IoT devices for automated tracking

## Repository Structure
- `/Backend` - Node.js/TypeScript backend services
- `/Frontend` - React-based web application
- `/Doc` - Project documentation (EN/VN)
  - Technical documentation
  - User stories
  - Architecture documents
  - Maintenance guides

## 📚 Documentation

Comprehensive documentation is available in the `Doc` directory:
- [Business Requirements Document](Doc/EN/Tubex_BRD.md)
- [Product Requirements Document](Doc/EN/Tubex_PRD.md)
- [Technical Design Document](Doc/EN/Tubex_TDD.md)
- [Warehouse Service Architecture](Doc/EN/Warehouse_Service_Architecture.md)
- [Backend Maintenance Guide](Doc/EN/Backend_Maintenance.md)
- API Documentation (available at `/api-docs` when running the server)

## 🧪 Running Tests

```bash
# Backend tests
cd Backend
npm test

# Frontend tests
cd Frontend/app
npm test
```

## 🔒 Security

- JWT-based authentication
- Rate limiting
- Data encryption
- CORS protection
- Helmet security headers
- Input validation
- SQL injection prevention

## 📄 License

**PROPRIETARY AND CONFIDENTIAL**

Copyright (c) 2023-2025 Tubex

This software and associated documentation files (the "Software") are the proprietary property of Tubex and/or its licensors.

All rights are reserved. Unauthorized copying, distribution, modification, public display, or public performance of this proprietary software is strictly prohibited.

The Software is provided for evaluation and internal use only and may not be used for any commercial or production purposes without express written permission from Tubex.

No license, express or implied, to any intellectual property rights is granted by this document or in connection with the Software.

**THIS SOFTWARE IS PROVIDED "AS IS" AND WITHOUT ANY WARRANTY, EXPRESS OR IMPLIED.**

## 👥 Contributing

We welcome contributions to the Tubex project! Here's how you can contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run tests to ensure everything works (`npm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to your branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

Please ensure your code follows the project's coding standards and includes appropriate tests.

## 📞 Support

For support, please contact:

- Email: support@tubex.io
- Issue Tracker: [GitHub Issues](https://github.com/tubex/tubex/issues)
- Documentation: See the `Doc` directory for comprehensive guides

For business inquiries, please contact business@tubex.io
