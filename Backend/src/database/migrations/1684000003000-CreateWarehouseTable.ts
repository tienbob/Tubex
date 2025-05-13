import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWarehouseTable1684000003000 implements MigrationInterface {
    name = 'CreateWarehouseTable1684000003000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create warehouses table
        await queryRunner.query(`
            CREATE TABLE "warehouses" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR(255) NOT NULL,
                "address" TEXT,
                "company_id" UUID NOT NULL REFERENCES companies(id),
                "capacity" DECIMAL(10,2),
                "contact_info" JSONB,
                "type" VARCHAR(50) NOT NULL DEFAULT 'storage',
                "status" VARCHAR(50) NOT NULL DEFAULT 'active',
                "notes" TEXT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_warehouses_company" ON "warehouses"("company_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index
        await queryRunner.query(`DROP INDEX "idx_warehouses_company"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "warehouses"`);
    }
}
