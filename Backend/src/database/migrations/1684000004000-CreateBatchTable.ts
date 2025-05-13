import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateBatchTable1684000004000 implements MigrationInterface {
    name = 'CreateBatchTable1684000004000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create batches table
        await queryRunner.query(`
            CREATE TABLE "batches" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "batch_number" VARCHAR(100) NOT NULL,
                "product_id" UUID NOT NULL REFERENCES products(id),
                "warehouse_id" UUID NOT NULL REFERENCES warehouses(id),
                "quantity" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR(50) NOT NULL,
                "manufacturing_date" TIMESTAMP,
                "expiry_date" TIMESTAMP,
                "metadata" JSONB,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_batches_product" ON "batches"("product_id")`);
        await queryRunner.query(`CREATE INDEX "idx_batches_warehouse" ON "batches"("warehouse_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_batches_warehouse"`);
        await queryRunner.query(`DROP INDEX "idx_batches_product"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "batches"`);
    }
}
