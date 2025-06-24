import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProductForeignKeyToDealerProducts20250624235959 implements MigrationInterface {
    name = 'AddProductForeignKeyToDealerProducts20250624235959'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealer_products"
            ADD CONSTRAINT "FK_product" FOREIGN KEY ("product_id") REFERENCES "products"("id") ON DELETE CASCADE;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dealer_products" DROP CONSTRAINT IF EXISTS "FK_product";
        `);
    }
}
