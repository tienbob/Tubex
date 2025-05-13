# Tubex Database Structure Documentation

**Document Version:** 1.0  
**Last Updated:** May 13, 2025  
**Author:** Technical Team

## Table of Contents

1. [Introduction](#introduction)
2. [Database Overview](#database-overview)
3. [Database Technology Stack](#database-technology-stack)
4. [PostgreSQL Database Structure](#postgresql-database-structure)
   - [Entity Relationship Diagram](#entity-relationship-diagram)
   - [Tables and Relationships](#tables-and-relationships)
5. [MongoDB Database Structure](#mongodb-database-structure)
6. [Redis Implementation](#redis-implementation)
7. [Data Migration Strategy](#data-migration-strategy)
8. [Backup and Recovery Procedures](#backup-and-recovery-procedures)

## Introduction

This document provides a comprehensive overview of the Tubex B2B SaaS Platform's database architecture. It details the structure, relationships, and implementation details of our multi-database approach using PostgreSQL, MongoDB, and Redis.

## Database Overview

The Tubex platform implements a hybrid database architecture:

- **PostgreSQL**: For structured relational data with complex relationships (users, companies, products, orders, inventory)
- **MongoDB**: For flexible, schema-less data (analytics, logs, customer activities)
- **Redis**: For caching, session management, and rate limiting

This approach allows us to leverage the strengths of each database technology while maintaining data integrity and ensuring high performance.

## Database Technology Stack

| Database   | Version | Purpose                                     | Connection Details                     |
|------------|---------|---------------------------------------------|---------------------------------------|
| PostgreSQL | 14      | Main relational data storage                | Host: postgres, Port: 5432            |
| MongoDB    | 6       | Document storage for analytics and logging  | Host: mongodb, Port: 27017            |
| Redis      | 7       | Caching, session storage and rate limiting  | Host: redis, Port: 6379               |

## PostgreSQL Database Structure

### Entity Relationship Diagram

[ERD diagram would be placed here in an actual document]

### Tables and Relationships

#### Users Table (users)

The Users table stores information about all system users.

**Columns:**
- `id` (UUID, PK): Unique identifier for the user
- `email` (VARCHAR, Unique): User's email address
- `password_hash` (VARCHAR): Encrypted password
- `role` (VARCHAR): User role (admin, manager, staff)
- `status` (VARCHAR): Account status (active, inactive, etc.)
- `company_id` (UUID, FK): Foreign key reference to the Companies table
- `metadata` (JSONB): Additional user metadata
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Relationships:**
- Many-to-One with Companies (`company_id` → Companies.`id`)

#### Companies Table (companies)

Stores information about companies using the Tubex platform.

**Columns:**
- `id` (UUID, PK): Unique identifier for the company
- `name` (VARCHAR): Company name
- `type` (VARCHAR): Company type (dealer, supplier)
- `tax_id` (VARCHAR, Unique): Tax identifier
- `business_license` (VARCHAR): Business license number
- `address` (JSONB): Company address information
- `business_category` (VARCHAR, Nullable): Business category
- `employee_count` (INTEGER, Nullable): Number of employees
- `year_established` (INTEGER, Nullable): Year the company was established
- `contact_phone` (VARCHAR): Contact phone number
- `subscription_tier` (VARCHAR): Subscription level (free, basic, premium)
- `status` (VARCHAR): Company status (pending_verification, active, suspended, rejected)
- `metadata` (JSONB, Nullable): Additional company metadata
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Relationships:**
- One-to-Many with Users (Companies.`id` → Users.`company_id`)
- One-to-Many with Products (Companies.`id` → Products.`supplier_id`)
- One-to-Many with Warehouses (Companies.`id` → Warehouses.`company_id`)

#### Products Table (products)

Stores product information offered by suppliers.

**Columns:**
- `id` (UUID, PK): Unique identifier for the product
- `name` (VARCHAR): Product name
- `description` (TEXT, Nullable): Product description
- `base_price` (DECIMAL): Base product price
- `unit` (VARCHAR): Unit of measurement
- `supplier_id` (UUID, FK): Reference to the supplier (company)
- `status` (VARCHAR): Product status (active, discontinued, etc.)
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Relationships:**
- Many-to-One with Companies (`supplier_id` → Companies.`id`)
- One-to-Many with OrderItems (Products.`id` → OrderItems.`productId`)
- One-to-Many with Inventory (Products.`id` → Inventory.`product_id`)
- One-to-Many with Batches (Products.`id` → Batches.`product_id`)

#### Orders Table (orders)

Stores order information.

**Columns:**
- `id` (UUID, PK): Unique identifier for the order
- `customerId` (UUID): Reference to the customer (company)
- `status` (ENUM): Order status (pending, confirmed, processing, shipped, delivered, cancelled)
- `paymentStatus` (ENUM): Payment status (pending, paid, failed, refunded)
- `paymentMethod` (VARCHAR, Nullable): Payment method used
- `totalAmount` (DECIMAL): Total order amount
- `deliveryAddress` (JSONB, Nullable): Delivery address
- `metadata` (JSONB, Nullable): Additional order metadata
- `createdAt` (TIMESTAMP): Creation timestamp
- `updatedAt` (TIMESTAMP): Last update timestamp

**Relationships:**
- One-to-Many with OrderItems (Orders.`id` → OrderItems.`orderId`)
- One-to-Many with OrderHistory (Orders.`id` → OrderHistory.`order_id`)

#### Order Items Table (order_items)

Stores individual items within an order.

**Columns:**
- `id` (UUID, PK): Unique identifier for the order item
- `orderId` (UUID, FK): Reference to the parent order
- `productId` (UUID, FK): Reference to the product
- `quantity` (DECIMAL): Quantity ordered
- `unitPrice` (DECIMAL): Unit price at time of order
- `discount` (DECIMAL): Discount amount
- `metadata` (JSONB, Nullable): Additional item metadata
- `createdAt` (TIMESTAMP): Creation timestamp

**Relationships:**
- Many-to-One with Orders (`orderId` → Orders.`id`)
- Many-to-One with Products (`productId` → Products.`id`)

#### Order History Table (order_history)

Tracks the history of status changes for orders.

**Columns:**
- `id` (UUID, PK): Unique identifier for the history record
- `order_id` (UUID, FK): Reference to the order
- `user_id` (UUID, FK): Reference to the user who made the change
- `previous_status` (VARCHAR): Previous order status
- `new_status` (VARCHAR): New order status
- `notes` (TEXT, Nullable): Notes about the status change
- `metadata` (JSONB, Nullable): Additional metadata
- `created_at` (TIMESTAMP): Creation timestamp

**Relationships:**
- Many-to-One with Orders (`order_id` → Orders.`id`)
- Many-to-One with Users (`user_id` → Users.`id`)

#### Inventory Table (inventory)

Tracks inventory levels across warehouses.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `product_id` (UUID, FK): Reference to the product
- `company_id` (UUID, FK): Reference to the company
- `warehouse_id` (UUID, FK): Reference to the warehouse
- `quantity` (DECIMAL): Current quantity in stock
- `unit` (VARCHAR): Unit of measurement
- `min_threshold` (DECIMAL, Nullable): Minimum threshold for alerts
- `max_threshold` (DECIMAL, Nullable): Maximum capacity threshold
- `reorder_point` (DECIMAL, Nullable): Point at which to reorder
- `reorder_quantity` (DECIMAL, Nullable): Quantity to reorder
- `auto_reorder` (BOOLEAN): Whether to automatically reorder
- `last_reorder_date` (TIMESTAMP, Nullable): Date of last reorder
- `metadata` (JSONB, Nullable): Additional metadata
- `status` (VARCHAR): Status of the inventory item
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Relationships:**
- Many-to-One with Products (`product_id` → Products.`id`)
- Many-to-One with Companies (`company_id` → Companies.`id`)
- Many-to-One with Warehouses (`warehouse_id` → Warehouses.`id`)

#### Warehouses Table (warehouses)

Stores information about company warehouses.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `name` (VARCHAR): Warehouse name
- `address` (TEXT, Nullable): Physical address
- `company_id` (UUID, FK): Reference to the owning company
- `capacity` (DECIMAL, Nullable): Storage capacity
- `contact_info` (JSONB, Nullable): Contact person details
- `type` (VARCHAR): Warehouse type (main, secondary, distribution, storage)
- `status` (VARCHAR): Status (active, inactive, under_maintenance)
- `notes` (TEXT, Nullable): Additional notes
- `metadata` (JSONB, Nullable): Additional metadata
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Relationships:**
- Many-to-One with Companies (`company_id` → Companies.`id`)
- One-to-Many with Inventory (Warehouses.`id` → Inventory.`warehouse_id`)
- One-to-Many with Batches (Warehouses.`id` → Batches.`warehouse_id`)

#### Batches Table (batches)

Tracks product batches for inventory management.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `batch_number` (VARCHAR): Batch identifier 
- `product_id` (UUID, FK): Reference to the product
- `warehouse_id` (UUID, FK): Reference to the warehouse
- `quantity` (DECIMAL): Quantity in the batch
- `unit` (VARCHAR): Unit of measurement
- `manufacturing_date` (TIMESTAMP, Nullable): Manufacturing date
- `expiry_date` (TIMESTAMP, Nullable): Expiry date
- `metadata` (JSONB, Nullable): Additional metadata
- `status` (VARCHAR): Batch status
- `created_at` (TIMESTAMP): Creation timestamp
- `updated_at` (TIMESTAMP): Last update timestamp

**Relationships:**
- Many-to-One with Products (`product_id` → Products.`id`)
- Many-to-One with Warehouses (`warehouse_id` → Warehouses.`id`)

#### User Audit Logs Table (user_audit_logs)

Tracks changes to user accounts.

**Columns:**
- `id` (UUID, PK): Unique identifier
- `target_user_id` (UUID, FK): Reference to the user being modified
- `performed_by_id` (UUID, FK): Reference to the user making the change
- `action` (VARCHAR): Type of action performed
- `changes` (JSONB): Details of changes made
- `reason` (TEXT, Nullable): Reason for the change
- `created_at` (TIMESTAMP): Creation timestamp

**Relationships:**
- Many-to-One with Users (`target_user_id` → Users.`id`)
- Many-to-One with Users (`performed_by_id` → Users.`id`)

## MongoDB Database Structure

MongoDB is used for flexible, schema-less data storage where the structure may evolve over time.

### Collections

#### Orders Collection

While the core order data is stored in PostgreSQL, MongoDB stores additional order details for flexible querying and analytics.

**Fields:**
- `orderId` (String, Indexed): Corresponds to PostgreSQL order ID
- `companyId` (String, Indexed): Company identifier
- `customerId` (String, Indexed): Customer identifier
- `items` (Array): Array of product items
- `status` (String, Enum): Order status
- `paymentStatus` (String, Enum): Payment status
- `paymentMethod` (String): Payment method
- `deliveryAddress` (Object): Delivery address details
- `metadata` (Mixed): Additional order metadata
- `createdAt` (Date, Indexed): Creation timestamp
- `updatedAt` (Date): Last update timestamp

#### Analytics Collection

Stores user behavior and system metrics data.

**Fields:**
- `eventType` (String, Indexed): Type of event
- `companyId` (String, Indexed): Company identifier
- `userId` (String): User identifier
- `timestamp` (Date, Indexed): When the event occurred
- `data` (Mixed): Event-specific data
- `metadata` (Mixed): Additional metadata

#### Audit Log Collection

Tracks system changes and user actions.

**Fields:**
- `action` (String): Action performed
- `entityType` (String): Type of entity affected
- `entityId` (String): Identifier of affected entity
- `companyId` (String, Indexed): Company identifier
- `userId` (String): User who performed the action
- `changes` (Mixed): Details of changes
- `timestamp` (Date, Indexed): When the action occurred

#### Customer Activity Collection

Tracks customer interactions with the system.

**Fields:**
- `customerId` (String, Indexed): Customer identifier
- `companyId` (String, Indexed): Company identifier
- `activityType` (String): Type of activity
- `description` (String): Activity description
- `metadata` (Mixed): Additional metadata
- `timestamp` (Date, Indexed): When the activity occurred

## Redis Implementation

Redis is used for:

1. **Session Management**: Storing user session data
2. **Caching**: Improving performance by caching frequently accessed data
3. **Rate Limiting**: Preventing abuse of the API
4. **Job Queues**: Managing asynchronous tasks

### Key Structures

- **Session Data**: `session:{sessionId}`
- **Cache Keys**: `cache:{entityType}:{id}`
- **Rate Limiting**: `rateLimit:{ip}:{endpoint}`

## Data Migration Strategy

Tubex uses a migration-based approach to manage database schema changes:

1. **Migration Files**: Located in `src/database/migrations/`
2. **Naming Convention**: 
   - Timestamp-prefixed files for sequential execution
   - One file per table for clean organization
3. **Running Migrations**: Executed via TypeORM CLI

### Migration Command

```
npm run typeorm -- migration:run -d src/database/ormconfig.ts
```

### Current Migrations

Tubex now uses an organized, table-centric migration structure where each table has its own dedicated migration file:

1. `1684000000000-CreateCompanyTable.ts`: Comprehensive Company table creation
2. `1684000001000-CreateUserTable.ts`: User table with complete structure
3. `1684000002000-CreateProductTable.ts`: Product catalog table
4. `1684000003000-CreateWarehouseTable.ts`: Warehouse management
5. `1684000004000-CreateBatchTable.ts`: Inventory batch tracking
6. `1684000005000-CreateInventoryTable.ts`: Inventory management
7. `1684000006000-CreateOrderTable.ts`: Order processing
8. `1684000007000-CreateOrderItemTable.ts`: Order line items
9. `1684000008000-CreateOrderHistoryTable.ts`: Order status history
10. `1684000009000-CreateUserAuditLogTable.ts`: User activity auditing

This structure replaces the previous approach where migrations were split across multiple files by feature. The new approach provides several benefits:

- **Clarity**: One table per file makes it easier to understand the database structure
- **Maintainability**: Changes to a table are contained in a single file
- **Documentation**: Each migration serves as documentation for the table structure
- **Simplified Troubleshooting**: Easier to identify and fix issues related to a specific table

## Backup and Recovery Procedures

### Backup Strategy

1. **PostgreSQL**: Daily full backups with point-in-time recovery
2. **MongoDB**: Daily full backups and oplog-based incremental backups
3. **Redis**: RDB snapshots and AOF logs

### Backup Locations

Backups are stored in:
- Primary location: Cloud storage bucket
- Secondary location: Offsite encrypted storage

### Recovery Process

1. Stop application services
2. Restore database from backup
3. Verify data integrity
4. Apply any pending migrations
5. Restart services

### Disaster Recovery Testing

Scheduled quarterly DR tests ensure backup integrity and procedure effectiveness.
