import { MigrationInterface, QueryRunner } from "typeorm";

export class OrdersCompanyIdToUuidMigration1729728000000 implements MigrationInterface {
    name = 'OrdersCompanyIdToUuidMigration1729728000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Convert companyId and customerId columns to uuid
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "companyId" TYPE uuid USING "companyId"::uuid,
            ALTER COLUMN "customerId" TYPE uuid USING "customerId"::uuid;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert columns back to varchar if needed
        await queryRunner.query(`
            ALTER TABLE "orders"
            ALTER COLUMN "companyId" TYPE varchar USING "companyId"::text,
            ALTER COLUMN "customerId" TYPE varchar USING "customerId"::text;
        `);
    }
}
