import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProductCategoryTable1747500000000 implements MigrationInterface {
    name = 'CreateProductCategoryTable1747500000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create product_categories table
        await queryRunner.query(`
            CREATE TABLE "product_categories" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR NOT NULL,
                "description" TEXT,
                "company_id" UUID REFERENCES companies(id),
                "parent_id" UUID REFERENCES product_categories(id),
                "status" VARCHAR NOT NULL DEFAULT 'active',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_product_categories_company" ON "product_categories"("company_id")`);
        await queryRunner.query(`CREATE INDEX "idx_product_categories_parent" ON "product_categories"("parent_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_product_categories_parent"`);
        await queryRunner.query(`DROP INDEX "idx_product_categories_company"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "product_categories"`);
    }
}
