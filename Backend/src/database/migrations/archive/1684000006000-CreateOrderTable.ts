import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderTable1684000006000 implements MigrationInterface {
    name = 'CreateOrderTable1684000006000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create order status and payment status enums
        await queryRunner.query(`
            CREATE TYPE order_status AS ENUM ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled');
            CREATE TYPE payment_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
        `);
        
        // Create orders table
        await queryRunner.query(`
            CREATE TABLE "orders" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "customerId" UUID NOT NULL,
                "status" order_status NOT NULL DEFAULT 'pending',
                "paymentStatus" payment_status NOT NULL DEFAULT 'pending',
                "paymentMethod" VARCHAR,
                "totalAmount" DECIMAL(10,2) NOT NULL,
                "deliveryAddress" JSONB,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_orders_customer" ON "orders"("customerId")`);
        await queryRunner.query(`CREATE INDEX "idx_orders_status" ON "orders"("status")`);
        await queryRunner.query(`CREATE INDEX "idx_orders_payment_status" ON "orders"("paymentStatus")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_orders_payment_status"`);
        await queryRunner.query(`DROP INDEX "idx_orders_status"`);
        await queryRunner.query(`DROP INDEX "idx_orders_customer"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "orders"`);
        
        // Drop enums
        await queryRunner.query(`DROP TYPE payment_status`);
        await queryRunner.query(`DROP TYPE order_status`);
    }
}
