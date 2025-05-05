# Tubex - B2B SaaS Platform for Construction Materials

A scalable B2B SaaS platform built to streamline the construction materials supply chain, featuring multi-tenant architecture, real-time inventory management, and comprehensive order tracking.

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
   - Backend API: http://localhost:3000/api/v1
   - API Documentation: http://localhost:3000/api-docs
   - Frontend: http://localhost:3001 (default React port)

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
│   │       ├── mongo/ # MongoDB schemas
│   │       └── sql/   # SQL models (users, products, orders, warehouses)
│   ├── middleware/    # Custom middleware
│   │   ├── auth.ts    # Authentication middleware
│   │   ├── cache.ts   # Caching middleware
│   │   ├── errorHandler.ts # Error handling
│   │   ├── rateLimiter.ts # Rate limiting
│   │   └── validation.ts # Input validation
│   ├── services/      # Business logic modules
│   │   ├── auth/      # Authentication service
│   │   ├── cache/     # Caching service
│   │   ├── email/     # Email notifications
│   │   ├── inventory/ # Inventory management
│   │   ├── order/     # Order processing
│   │   ├── product/   # Product management
│   │   └── user/      # User management
│   └── types/         # TypeScript type definitions
│       └── express.d.ts # Express extensions
└── tests/
    ├── e2e/          # End-to-end tests
    ├── integration/  # API integration tests
    └── unit/         # Unit tests
Frontend/
├── app/
    └── src/
        ├── App.tsx           # Main application component
        ├── index.tsx         # Entry point
        ├── components/       # Reusable UI components
        │   └── whitelabel/   # Multi-tenant white-labeling
        ├── config/           # Frontend configuration
        ├── contexts/         # React context providers
        ├── hooks/            # Custom React hooks
        ├── services/         # API and utility services
        │   └── api/          # Backend API clients
        │       ├── apiClient.ts     # Base API client
        │       ├── authService.ts   # Authentication API
        │       ├── productService.ts # Product API
        │       ├── orderService.ts  # Order API
        │       └── inventoryService.ts # Inventory API
        ├── styles/           # Global styles and themes
        └── types/            # TypeScript type definitions
```

## 📊 Project Status

The project is currently in active development with the following components completed:

- ✅ Backend foundation with Express and TypeScript
- ✅ Database setup with PostgreSQL, MongoDB, and Redis
- ✅ Authentication system with JWT
- ✅ API structure and core endpoints
- ✅ Frontend structure with React components
- ✅ API client services for frontend-backend communication
- ✅ Multi-tenant white-labeling foundation
- ✅ Basic inventory and order management

In progress:
- 🔄 Advanced reporting and analytics features
- 🔄 Mobile application development with React Native
- 🔄 Payment gateway integrations
- 🔄 Performance optimizations and scalability enhancements

Upcoming:
- 📅 Advanced user roles and permissions
- 📅 AI-powered inventory forecasting
- 📅 Business intelligence dashboard
- 📅 Mobile app deployment to app stores

## 📚 Documentation

Comprehensive documentation is available in the `Doc` directory:
- Technical Design Document (TDD)
- Business Requirements Document (BRD)
- Product Requirements Document (PRD)
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