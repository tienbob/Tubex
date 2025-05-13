import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderItemTable1684000007000 implements MigrationInterface {
    name = 'CreateOrderItemTable1684000007000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create order items table
        await queryRunner.query(`
            CREATE TABLE "order_items" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "orderId" UUID NOT NULL REFERENCES orders(id),
                "productId" UUID NOT NULL REFERENCES products(id),
                "quantity" DECIMAL(10,2) NOT NULL,
                "unitPrice" DECIMAL(10,2) NOT NULL,
                "discount" DECIMAL(10,2) NOT NULL DEFAULT 0,
                "metadata" JSONB,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_order_items_order" ON "order_items"("orderId")`);
        await queryRunner.query(`CREATE INDEX "idx_order_items_product" ON "order_items"("productId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_order_items_product"`);
        await queryRunner.query(`DROP INDEX "idx_order_items_order"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "order_items"`);
    }
}
