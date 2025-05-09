# Tubex Backend

This is the backend service for the Tubex B2B SaaS Platform for Construction Materials.

## Development Environment Setup

### Using Docker Compose with Automatic Migrations

The easiest way to get started is to use Docker Compose with automatic migrations:

```bash
# On Windows
start-with-migrations.bat

# On Linux/Mac
chmod +x scripts/docker-migrate.sh
docker-compose up -d
```

This will:
1. Start PostgreSQL, MongoDB, and Redis services
2. Run all database migrations automatically
3. Make the services available on their default ports

### Manual Setup

If you prefer to run the services manually:

1. Start the database services:
   ```bash
   docker-compose up -d postgres mongodb redis
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run migrations:
   ```bash
   npm run migration:run
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

## Database Migrations

### Running Migrations

```bash
npm run migration:run
```

### Creating a New Migration

```bash
npm run migration:create -- -n YourMigrationName
```

### Reverting the Last Migration

```bash
npm run migration:revert
```

## API Documentation

The API documentation is available at `/api-docs` when the server is running.

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
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
```

## Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm run test:unit
npm run test:integration
npm run test:e2e
```
