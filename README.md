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
   # Fill in the required environment variables
   ```

4. Start the development environment:
   ```bash
   # Start backend services
   cd Backend
   docker-compose up -d
   npm run dev

   # Start frontend
   cd ../Frontend/app
   npm start
   ```

## 🏗️ Project Structure

```
Backend/
├── src/
│   ├── config/        # Configuration management
│   ├── database/      # Database connections and models
│   ├── middleware/    # Custom middleware
│   ├── services/      # Business logic modules
│   └── server.ts      # Application entry point
Frontend/
└── app/
    └── src/
        ├── components/
        ├── pages/
        ├── services/
        └── store/

```

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

[License details to be added]

## 👥 Contributing

[Contribution guidelines to be added]

## 📞 Support

[Support contact information to be added]