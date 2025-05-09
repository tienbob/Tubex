#!/bin/bash
set -e

echo "Running Tubex database migrations..."
cd /app

# Ensure TypeScript is compiled
echo "Compiling TypeScript..."
npm run build

# Run migrations
echo "Running migrations..."
npm run migration:run

echo "Migrations completed successfully!"
