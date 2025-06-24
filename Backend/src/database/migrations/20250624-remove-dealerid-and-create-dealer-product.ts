import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveDealerIdAndCreateDealerProduct20250624123456 implements MigrationInterface {
    name = 'RemoveDealerIdAndCreateDealerProduct20250624123456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove dealerId column from product table
        await queryRunner.query(`ALTER TABLE "products" DROP COLUMN IF EXISTS "dealer_id";`);
        // Create dealer_product table
        await queryRunner.query(`CREATE TABLE "dealer_products" (
            "product_id" uuid NOT NULL PRIMARY KEY,
            "dealer_id" uuid NOT NULL,
            CONSTRAINT "FK_dealer" FOREIGN KEY ("dealer_id") REFERENCES "users"("id")
        );`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop dealer_product table
        await queryRunner.query(`DROP TABLE IF EXISTS "dealer_products";`);
        // Add dealerId column back to product table (type INT, nullable)
        await queryRunner.query(`ALTER TABLE "products" ADD COLUMN "dealer_id" uuid;`);
    }
}
