import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderTables1682400003000 implements MigrationInterface {
    name = 'AddOrderTables1682400003000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create enums
        await queryRunner.query(`
            CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
            CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
        `);

        // Create orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "customerId" UUID NOT NULL REFERENCES "users"("id"),
                "status" order_status NOT NULL DEFAULT 'pending',
                "paymentStatus" payment_status NOT NULL DEFAULT 'pending',
                "paymentMethod" VARCHAR,
                "totalAmount" DECIMAL(10,2) NOT NULL,
                "deliveryAddress" JSONB,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX "idx_orders_customer" ON "orders"("customerId");
            CREATE INDEX "idx_orders_status" ON "orders"("status");
            CREATE INDEX "idx_orders_payment_status" ON "orders"("paymentStatus");
        `);

        // Create order items table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "orderId" UUID NOT NULL REFERENCES "orders"("id") ON DELETE CASCADE,
                "productId" UUID NOT NULL REFERENCES "products"("id"),
                "quantity" DECIMAL(10,2) NOT NULL,
                "unitPrice" DECIMAL(10,2) NOT NULL,
                "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX "idx_order_items_order" ON "order_items"("orderId");
            CREATE INDEX "idx_order_items_product" ON "order_items"("productId");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_order_items_product";
            DROP INDEX "idx_order_items_order";
            DROP TABLE "order_items";
            
            DROP INDEX "idx_orders_payment_status";
            DROP INDEX "idx_orders_status";
            DROP INDEX "idx_orders_customer";
            DROP TABLE "orders";
            
            DROP TYPE payment_status;
            DROP TYPE order_status;
        `);
    }
}