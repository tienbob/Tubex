import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchemaComplete1735000000000 implements MigrationInterface {
    name = 'InitialSchemaComplete1735000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create all necessary ENUMs
        await queryRunner.query(`CREATE TYPE "company_type" AS ENUM('dealer', 'supplier')`);
        await queryRunner.query(`CREATE TYPE "subscription_tier" AS ENUM('free', 'basic', 'premium')`);
        await queryRunner.query(`CREATE TYPE "company_status" AS ENUM('pending_verification', 'active', 'suspended', 'rejected')`);
        await queryRunner.query(`CREATE TYPE "user_role" AS ENUM('admin', 'manager', 'staff')`);
        await queryRunner.query(`CREATE TYPE "order_status" AS ENUM('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')`);
        await queryRunner.query(`CREATE TYPE "payment_status" AS ENUM('pending', 'paid', 'failed', 'refunded')`);
        await queryRunner.query(`CREATE TYPE "invoice_status" AS ENUM('draft', 'sent', 'viewed', 'paid', 'partially_paid', 'overdue', 'void')`);
        await queryRunner.query(`CREATE TYPE "payment_method" AS ENUM('credit_card', 'bank_transfer', 'cash', 'check', 'paypal', 'stripe', 'other')`);
        await queryRunner.query(`CREATE TYPE "payment_type" AS ENUM('order_payment', 'invoice_payment', 'refund', 'advance_payment', 'adjustment')`);
        await queryRunner.query(`CREATE TYPE "payment_reconciliation_status" AS ENUM('unreconciled', 'reconciled', 'disputed', 'pending_review')`);
        await queryRunner.query(`CREATE TYPE "payment_term" AS ENUM('immediate', 'net7', 'net15', 'net30', 'net45', 'net60', 'net90')`);
        await queryRunner.query(`CREATE TYPE "warehouse_type" AS ENUM('main', 'secondary', 'distribution', 'storage')`);
        await queryRunner.query(`CREATE TYPE "warehouse_status" AS ENUM('active', 'inactive', 'under_maintenance')`);
        await queryRunner.query(`CREATE TYPE "price_list_status" AS ENUM('active', 'inactive', 'archived', 'draft')`);

        // Create companies table
        await queryRunner.query(`
            CREATE TABLE "companies" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(255) NOT NULL,
                "type" "company_type" NOT NULL,
                "tax_id" VARCHAR(20) NOT NULL UNIQUE,
                "business_license" VARCHAR(100) NOT NULL,
                "address" JSONB NOT NULL,
                "business_category" VARCHAR(100),
                "employee_count" INTEGER,
                "year_established" INTEGER,
                "contact_phone" VARCHAR(20) NOT NULL,
                "subscription_tier" "subscription_tier" NOT NULL DEFAULT 'free',
                "status" "company_status" NOT NULL DEFAULT 'pending_verification',
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "email" VARCHAR(255) NOT NULL UNIQUE,
                "password_hash" VARCHAR(255) NOT NULL,
                "role" "user_role" NOT NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create products table
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "base_price" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR(50) NOT NULL,
                "supplier_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "dealer_id" UUID REFERENCES "companies"("id") ON DELETE SET NULL,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create warehouses table
        await queryRunner.query(`
            CREATE TABLE "warehouses" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(255) NOT NULL,
                "address" TEXT,
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "capacity" DECIMAL(10,2),
                "contact_info" JSONB,
                "type" "warehouse_type" NOT NULL DEFAULT 'storage',
                "status" "warehouse_status" NOT NULL DEFAULT 'active',
                "notes" TEXT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create batches table (CRITICAL: with company_id for multi-tenant isolation)
        await queryRunner.query(`
            CREATE TABLE "batches" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "batch_number" VARCHAR(100) NOT NULL,
                "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "warehouse_id" UUID NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "quantity" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR(50) NOT NULL,
                "manufacturing_date" TIMESTAMP,
                "expiry_date" TIMESTAMP,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_batches_batch_number_company" UNIQUE ("batch_number", "company_id")
            )
        `);

        // Create inventory table
        await queryRunner.query(`
            CREATE TABLE "inventory" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "warehouse_id" UUID NOT NULL REFERENCES "warehouses"("id") ON DELETE CASCADE,
                "quantity" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR(50) NOT NULL,
                "min_threshold" DECIMAL(10,2),
                "max_threshold" DECIMAL(10,2),
                "reorder_point" DECIMAL(10,2),
                "reorder_quantity" DECIMAL(10,2),
                "auto_reorder" BOOLEAN NOT NULL DEFAULT false,
                "last_reorder_date" TIMESTAMP,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_inventory_product_warehouse_company" UNIQUE ("product_id", "warehouse_id", "company_id")
            )
        `);

        // Create orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "customerId" VARCHAR(255) NOT NULL,
                "companyId" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "status" "order_status" NOT NULL DEFAULT 'pending',
                "paymentStatus" "payment_status" NOT NULL DEFAULT 'pending',
                "paymentMethod" VARCHAR(50),
                "totalAmount" DECIMAL(10,2) NOT NULL,
                "deliveryAddress" JSONB,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create order_items table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
                "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "quantity" DECIMAL(10,2) NOT NULL,
                "unitPrice" DECIMAL(10,2) NOT NULL,
                "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create payments table (CRITICAL: with companyId for multi-tenant isolation)
        await queryRunner.query(`
            CREATE TABLE "payments" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "transactionId" VARCHAR(255) NOT NULL UNIQUE,
                "orderId" UUID REFERENCES "orders"("id") ON DELETE SET NULL,
                "invoiceId" UUID,
                "customerId" VARCHAR(255) NOT NULL,
                "companyId" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "amount" DECIMAL(10,2) NOT NULL,
                "paymentMethod" "payment_method" NOT NULL DEFAULT 'bank_transfer',
                "paymentType" "payment_type" NOT NULL DEFAULT 'invoice_payment',
                "paymentDate" TIMESTAMP NOT NULL,
                "externalReferenceId" VARCHAR(255),
                "notes" TEXT,
                "reconciliationStatus" "payment_reconciliation_status" NOT NULL DEFAULT 'unreconciled',
                "reconciliationDate" TIMESTAMP,
                "reconciledById" UUID REFERENCES "users"("id") ON DELETE SET NULL,
                "recordedById" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create invoices table
        await queryRunner.query(`
            CREATE TABLE "invoices" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "invoiceNumber" VARCHAR(255) NOT NULL,
                "customerId" VARCHAR(255) NOT NULL,
                "status" "invoice_status" NOT NULL DEFAULT 'draft',
                "totalAmount" DECIMAL(10,2) NOT NULL,
                "paidAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "orderId" UUID REFERENCES "orders"("id") ON DELETE SET NULL,
                "paymentTerm" "payment_term" NOT NULL DEFAULT 'net30',
                "issueDate" DATE NOT NULL,
                "dueDate" DATE NOT NULL,
                "billingAddress" JSONB,
                "notes" TEXT,
                "createdById" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_invoices_number_customer" UNIQUE ("invoiceNumber", "customerId")
            )
        `);

        // Create invoice_items table
        await queryRunner.query(`
            CREATE TABLE "invoice_items" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "invoiceId" UUID NOT NULL REFERENCES "invoices"("id") ON DELETE CASCADE,
                "productId" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "description" VARCHAR(255),
                "quantity" DECIMAL(10,2) NOT NULL,
                "unitPrice" DECIMAL(10,2) NOT NULL,
                "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "tax" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "notes" TEXT,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create other supporting tables
        await queryRunner.query(`
            CREATE TABLE "order_history" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "order_id" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
                "user_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "previous_status" VARCHAR(50) NOT NULL,
                "new_status" VARCHAR(50) NOT NULL,
                "notes" TEXT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "price_lists" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(100) NOT NULL,
                "description" TEXT,
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "status" "price_list_status" NOT NULL DEFAULT 'draft',
                "effective_from" DATE,
                "effective_to" DATE,
                "is_default" BOOLEAN NOT NULL DEFAULT false,
                "global_discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "price_list_items" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "price_list_id" UUID NOT NULL REFERENCES "price_lists"("id") ON DELETE CASCADE,
                "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "price" DECIMAL(10,2) NOT NULL,
                "discount_percentage" DECIMAL(5,2) NOT NULL DEFAULT 0,
                "effective_from" DATE,
                "effective_to" DATE,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create quotes table
        await queryRunner.query(`
            CREATE TABLE "quotes" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "quote_number" VARCHAR(255) NOT NULL UNIQUE,
                "customer_id" VARCHAR(255) NOT NULL,
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "status" VARCHAR(50) NOT NULL DEFAULT 'draft',
                "total_amount" DECIMAL(10,2) NOT NULL,
                "valid_until" DATE NOT NULL,
                "notes" TEXT,
                "created_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "quote_items" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "quote_id" UUID NOT NULL REFERENCES "quotes"("id") ON DELETE CASCADE,
                "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "description" VARCHAR(255),
                "quantity" DECIMAL(10,2) NOT NULL,
                "unit_price" DECIMAL(10,2) NOT NULL,
                "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "notes" TEXT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "product_categories" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(255) NOT NULL,
                "description" TEXT,
                "parent_id" UUID REFERENCES "product_categories"("id") ON DELETE SET NULL,
                "company_id" UUID NOT NULL REFERENCES "companies"("id") ON DELETE CASCADE,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        await queryRunner.query(`
            CREATE TABLE "product_price_history" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "product_id" UUID NOT NULL REFERENCES "products"("id") ON DELETE CASCADE,
                "old_price" DECIMAL(10,2) NOT NULL,
                "new_price" DECIMAL(10,2) NOT NULL,
                "changed_by_id" UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
                "reason" TEXT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create all necessary indexes for performance and multi-tenant queries
        await queryRunner.query(`CREATE INDEX "IDX_companies_tax_id" ON "companies" ("tax_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_companies_type" ON "companies" ("type")`);
        await queryRunner.query(`CREATE INDEX "IDX_companies_status" ON "companies" ("status")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_users_company_id" ON "users" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_email" ON "users" ("email")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_products_supplier_id" ON "products" ("supplier_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_products_dealer_id" ON "products" ("dealer_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_products_supplier_status" ON "products" ("supplier_id", "status")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_warehouses_company_id" ON "warehouses" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_warehouses_company_type" ON "warehouses" ("company_id", "type")`);
        
        // CRITICAL INDEXES: Multi-tenant batch isolation
        await queryRunner.query(`CREATE INDEX "IDX_batches_company_id" ON "batches" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_batches_product_id" ON "batches" ("product_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_batches_warehouse_id" ON "batches" ("warehouse_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_batches_expiry_date" ON "batches" ("expiry_date")`);
        await queryRunner.query(`CREATE INDEX "IDX_batches_company_expiry" ON "batches" ("company_id", "expiry_date")`);
        
        // CRITICAL INDEXES: Multi-tenant inventory isolation
        await queryRunner.query(`CREATE INDEX "IDX_inventory_company_id" ON "inventory" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_product_id" ON "inventory" ("product_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_warehouse_id" ON "inventory" ("warehouse_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_inventory_company_warehouse" ON "inventory" ("company_id", "warehouse_id")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_orders_company_id" ON "orders" ("companyId")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_status" ON "orders" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_company_status" ON "orders" ("companyId", "status")`);
        
        // CRITICAL INDEXES: Multi-tenant payment isolation
        await queryRunner.query(`CREATE INDEX "IDX_payments_company_id" ON "payments" ("companyId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_transaction_id" ON "payments" ("transactionId")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_company_date" ON "payments" ("companyId", "paymentDate")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_invoices_customer_id" ON "invoices" ("customerId")`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_status" ON "invoices" ("status")`);
        await queryRunner.query(`CREATE INDEX "IDX_invoices_created_by" ON "invoices" ("createdById")`);
        
        await queryRunner.query(`CREATE INDEX "IDX_quotes_company_id" ON "quotes" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_price_lists_company_id" ON "price_lists" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_product_categories_company_id" ON "product_categories" ("company_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop all tables in reverse order to respect foreign key constraints
        await queryRunner.query(`DROP TABLE IF EXISTS "product_price_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "product_categories"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "quote_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "quotes"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "price_list_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "price_lists"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_history"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "invoice_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "invoices"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "payments"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "order_items"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "orders"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "inventory"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "batches"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "warehouses"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "products"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
        await queryRunner.query(`DROP TABLE IF EXISTS "companies"`);
        
        // Drop all ENUMs
        await queryRunner.query(`DROP TYPE IF EXISTS "price_list_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "warehouse_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "warehouse_type"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_term"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_reconciliation_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_type"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_method"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "invoice_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "payment_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "order_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "user_role"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "company_status"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "subscription_tier"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "company_type"`);
    }
}
