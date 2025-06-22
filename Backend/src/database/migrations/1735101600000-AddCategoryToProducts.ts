import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCategoryToProducts1735101600000 implements MigrationInterface {
    name = 'AddCategoryToProducts1735101600000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add category_id column to products table
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN "category_id" uuid
        `);

        // Add foreign key constraint
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_category_id" 
            FOREIGN KEY ("category_id") 
            REFERENCES "product_categories"("id") 
            ON DELETE SET NULL 
            ON UPDATE NO ACTION
        `);

        // Create index for better performance
        await queryRunner.query(`
            CREATE INDEX "IDX_products_category_id" 
            ON "products" ("category_id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "IDX_products_category_id"`);
        
        // Drop foreign key constraint
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_products_category_id"`);
        
        // Drop column
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN "category_id"`);
    }
}
