import { MigrationInterface, QueryRunner } from "typeorm";

export class CriticalModelFixes1735000000000 implements MigrationInterface {
    name = 'CriticalModelFixes1735000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add company_id to batches table for multi-tenant isolation
        await queryRunner.query(`ALTER TABLE "batches" ADD "company_id" uuid`);
        
        // Update existing batch records to inherit company_id from their warehouse
        await queryRunner.query(`
            UPDATE "batches" 
            SET "company_id" = "w"."company_id" 
            FROM "warehouses" "w" 
            WHERE "batches"."warehouse_id" = "w"."id" 
            AND "batches"."company_id" IS NULL
        `);
        
        // Make company_id NOT NULL after data migration
        await queryRunner.query(`ALTER TABLE "batches" ALTER COLUMN "company_id" SET NOT NULL`);
        
        // Add foreign key constraint for batches.company_id
        await queryRunner.query(`ALTER TABLE "batches" ADD CONSTRAINT "FK_batches_company_id" FOREIGN KEY ("company_id") REFERENCES "companies"("id") ON DELETE CASCADE`);
        
        // Add index for batches.company_id
        await queryRunner.query(`CREATE INDEX "IDX_batches_company_id" ON "batches" ("company_id")`);
        
        // Add unique constraint for batch_number per company
        await queryRunner.query(`ALTER TABLE "batches" ADD CONSTRAINT "UQ_batches_batch_number_company" UNIQUE ("batch_number", "company_id")`);

        // Add companyId to payments table for multi-tenant isolation
        await queryRunner.query(`ALTER TABLE "payments" ADD "companyId" uuid`);
        
        // Update existing payment records to inherit companyId from their orders
        await queryRunner.query(`
            UPDATE "payments" 
            SET "companyId" = "o"."companyId" 
            FROM "orders" "o" 
            WHERE "payments"."orderId" = "o"."id" 
            AND "payments"."companyId" IS NULL
        `);
        
        // For invoice payments, get company from customer's company
        await queryRunner.query(`
            UPDATE "payments" 
            SET "companyId" = "u"."company_id" 
            FROM "invoices" "i" 
            JOIN "users" "u" ON "i"."customerId" = "u"."id" 
            WHERE "payments"."invoiceId" = "i"."id" 
            AND "payments"."companyId" IS NULL
        `);
        
        // Make companyId NOT NULL after data migration
        await queryRunner.query(`ALTER TABLE "payments" ALTER COLUMN "companyId" SET NOT NULL`);
        
        // Add foreign key constraint for payments.companyId
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_payments_company_id" FOREIGN KEY ("companyId") REFERENCES "companies"("id") ON DELETE CASCADE`);
        
        // Add index for payments.companyId
        await queryRunner.query(`CREATE INDEX "IDX_payments_company_id" ON "payments" ("companyId")`);

        // Add unique constraint for inventory per product-warehouse-company combination
        await queryRunner.query(`CREATE UNIQUE INDEX "UQ_inventory_product_warehouse_company" ON "inventory" ("product_id", "warehouse_id", "company_id")`);
        
        // Add unique constraint for invoice numbers per company
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "UQ_invoices_number_company" UNIQUE ("invoiceNumber", "customerId")`);

        // Add composite indexes for common multi-tenant queries
        await queryRunner.query(`CREATE INDEX "IDX_inventory_company_warehouse" ON "inventory" ("company_id", "warehouse_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_orders_company_status" ON "orders" ("companyId", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_payments_company_date" ON "payments" ("companyId", "paymentDate")`);
        await queryRunner.query(`CREATE INDEX "IDX_products_supplier_status" ON "products" ("supplier_id", "status")`);
        await queryRunner.query(`CREATE INDEX "IDX_warehouses_company_type" ON "warehouses" ("company_id", "type")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove indexes
        await queryRunner.query(`DROP INDEX "IDX_warehouses_company_type"`);
        await queryRunner.query(`DROP INDEX "IDX_products_supplier_status"`);
        await queryRunner.query(`DROP INDEX "IDX_payments_company_date"`);
        await queryRunner.query(`DROP INDEX "IDX_orders_company_status"`);
        await queryRunner.query(`DROP INDEX "IDX_inventory_company_warehouse"`);
        
        // Remove unique constraints
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "UQ_invoices_number_company"`);
        await queryRunner.query(`DROP INDEX "UQ_inventory_product_warehouse_company"`);
        
        // Remove payments.companyId
        await queryRunner.query(`DROP INDEX "IDX_payments_company_id"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_payments_company_id"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "companyId"`);
        
        // Remove batches.company_id
        await queryRunner.query(`ALTER TABLE "batches" DROP CONSTRAINT "UQ_batches_batch_number_company"`);
        await queryRunner.query(`DROP INDEX "IDX_batches_company_id"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP CONSTRAINT "FK_batches_company_id"`);
        await queryRunner.query(`ALTER TABLE "batches" DROP COLUMN "company_id"`);
    }
}
