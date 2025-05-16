#!/bin/bash

# Run migration for Quote tables
echo "Running migration for tables..."
npm run typeorm migration:run

# Verify the migration status
echo "Verifying migration status..."
npm run typeorm migration:show

echo "Migration completed successfully!"
