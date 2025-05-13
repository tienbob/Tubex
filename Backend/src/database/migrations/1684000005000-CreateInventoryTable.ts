import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventoryTable1684000005000 implements MigrationInterface {
    name = 'CreateInventoryTable1684000005000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create inventory table
        await queryRunner.query(`
            CREATE TABLE "inventory" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "product_id" UUID NOT NULL REFERENCES products(id),
                "company_id" UUID NOT NULL REFERENCES companies(id),
                "warehouse_id" UUID NOT NULL REFERENCES warehouses(id),
                "quantity" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR(50) NOT NULL,
                "min_threshold" DECIMAL(10,2),
                "max_threshold" DECIMAL(10,2),
                "reorder_point" DECIMAL(10,2),
                "reorder_quantity" DECIMAL(10,2),
                "auto_reorder" BOOLEAN NOT NULL DEFAULT false,
                "last_reorder_date" TIMESTAMP,
                "metadata" JSONB,
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_inventory_product" ON "inventory"("product_id")`);
        await queryRunner.query(`CREATE INDEX "idx_inventory_company" ON "inventory"("company_id")`);
        await queryRunner.query(`CREATE INDEX "idx_inventory_warehouse" ON "inventory"("warehouse_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_inventory_warehouse"`);
        await queryRunner.query(`DROP INDEX "idx_inventory_company"`);
        await queryRunner.query(`DROP INDEX "idx_inventory_product"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "inventory"`);
    }
}
