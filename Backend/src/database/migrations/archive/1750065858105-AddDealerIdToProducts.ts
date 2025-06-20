import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDealerIdToProducts1750065858105 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD COLUMN "dealer_id" uuid
        `);
        
        await queryRunner.query(`
            ALTER TABLE "products" 
            ADD CONSTRAINT "FK_products_dealer_id" 
            FOREIGN KEY ("dealer_id") REFERENCES "companies"("id")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP CONSTRAINT "FK_products_dealer_id"
        `);
        
        await queryRunner.query(`
            ALTER TABLE "products" 
            DROP COLUMN "dealer_id"
        `);
    }

}
