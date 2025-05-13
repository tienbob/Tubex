import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductTable1684000002000 implements MigrationInterface {
    name = 'CreateProductTable1684000002000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create products table
        await queryRunner.query(`
            CREATE TABLE "products" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR NOT NULL,
                "description" TEXT,
                "base_price" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR NOT NULL,
                "supplier_id" UUID REFERENCES companies(id),
                "status" VARCHAR NOT NULL DEFAULT 'active',
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_products_supplier" ON "products"("supplier_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "idx_products_supplier"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "products"`);
    }
}
