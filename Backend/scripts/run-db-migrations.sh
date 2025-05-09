#!/bin/bash
set -e

# Mark this script as executed so it only runs once
INIT_FLAG="/data/db/.migrations_initialized"

if [ ! -f "$INIT_FLAG" ]; then
    echo "==> First time initialization - running migrations"
    
    # Wait for databases to be ready
    echo "Waiting for PostgreSQL..."
    until pg_isready -h postgres -U postgres; do
        sleep 1
    done
    
    echo "Waiting for MongoDB..."
    until mongosh --host mongodb --eval "db.adminCommand('ping')" > /dev/null 2>&1; do
        sleep 1
    done
    
    echo "Databases are ready, running migrations..."
    cd /app && npm run migration:run
    
    echo "Creating initialization flag..."
    touch "$INIT_FLAG"
    echo "Migrations completed successfully!"
else
    echo "==> Migrations have already been run. Skipping."
fi
