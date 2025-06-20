import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCompanyIdToOrders1747500100000 implements MigrationInterface {
    name = 'AddCompanyIdToOrders1747500100000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add companyId column to orders table
        await queryRunner.query(`
            ALTER TABLE "orders" ADD COLUMN "companyId" UUID;
        `);

        // Copy customerId to companyId initially (this assumes customerId is the companyId)
        await queryRunner.query(`
            UPDATE "orders" SET "companyId" = "customerId";
        `);

        // Make companyId not null after we've populated it
        await queryRunner.query(`
            ALTER TABLE "orders" ALTER COLUMN "companyId" SET NOT NULL;
        `);

        // Create an index on companyId for better query performance
        await queryRunner.query(`CREATE INDEX "idx_orders_company" ON "orders"("companyId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index first
        await queryRunner.query(`DROP INDEX "idx_orders_company"`);
        
        // Drop the column
        await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN "companyId"`);
    }
}
