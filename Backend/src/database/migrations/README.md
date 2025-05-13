# Tubex Database Migrations

## Migration Structure

This directory contains the database migrations for the Tubex application. Each migration file follows a consistent naming pattern and organizational structure:

### Naming Convention

Migrations are named using the following format:
`{timestamp}-{action}{tableName}.ts`

For example:
- `1684000000000-CreateCompanyTable.ts`
- `1684000001000-CreateUserTable.ts`

The timestamp ensures migrations run in the correct order, and the descriptive name makes it clear what each migration does.

### One Table Per File

Each table in the database has its own dedicated migration file that contains:
- Initial table creation
- All columns with proper types and constraints
- Indexes and foreign keys
- Related enums (with proper existence checks)

This approach provides:
- **Clarity**: Easy to understand the database structure
- **Maintainability**: Changes to a table are contained in a single file
- **Documentation**: Each migration serves as documentation for the table structure
- **Simplified Troubleshooting**: Easier to identify and fix issues related to a specific table

## Important PostgreSQL Migration Notes

### Creating Enum Types

PostgreSQL doesn't support `IF NOT EXISTS` with `CREATE TYPE`. When creating enum types, use this pattern:

```typescript
// Check if enum exists before creating it
const enumExists = await queryRunner.query(`
    SELECT EXISTS (
        SELECT 1 FROM pg_type 
        WHERE typname = 'enum_name'
    );
`);

// Create enum only if it doesn't exist
if (!enumExists[0].exists) {
    await queryRunner.query(`CREATE TYPE enum_name AS ENUM ('value1', 'value2', 'value3')`);
}
```

## Running Migrations

To run migrations:

```bash
# Run pending migrations
npm run typeorm -- migration:run -d src/database/ormconfig.ts

# Show migration status
npm run typeorm -- migration:show -d src/database/ormconfig.ts

# Revert the most recent migration
npm run typeorm -- migration:revert -d src/database/ormconfig.ts
```

## Table Information

This folder contains migrations for the following tables:

1. **Company** (`companies`) - Business entities using the platform
2. **User** (`users`) - User accounts with authentication and roles
3. **Product** (`products`) - Products listed by suppliers
4. **Warehouse** (`warehouses`) - Physical storage locations
5. **Batch** (`batches`) - Product batches with expiry tracking
6. **Inventory** (`inventory`) - Stock levels by product/warehouse
7. **Order** (`orders`) - Customer orders
8. **OrderItem** (`order_items`) - Line items within orders
9. **OrderHistory** (`order_history`) - Status change tracking for orders
10. **UserAuditLog** (`user_audit_logs`) - Audit trail of user management actions
