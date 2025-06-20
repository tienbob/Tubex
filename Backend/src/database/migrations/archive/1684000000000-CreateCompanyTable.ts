import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCompanyTable1684000000000 implements MigrationInterface {
    name = 'CreateCompanyTable1684000000000';
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create company type enum (only if it doesn't exist)
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE company_type AS ENUM ('dealer', 'supplier');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        await queryRunner.query(`
            DO $$ BEGIN
                CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');
            EXCEPTION
                WHEN duplicate_object THEN null;
            END $$;
        `);
        
        // Create companies table (only if it doesn't exist)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "companies" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR NOT NULL,
                "type" company_type NOT NULL,
                "tax_id" VARCHAR(20) NOT NULL UNIQUE,
                "business_license" VARCHAR(100) NOT NULL,
                "address" JSONB NOT NULL,
                "business_category" VARCHAR(100),
                "employee_count" INTEGER,
                "year_established" INTEGER,
                "contact_phone" VARCHAR(20) NOT NULL,
                "subscription_tier" subscription_tier NOT NULL DEFAULT 'free',
                "status" VARCHAR(50) NOT NULL DEFAULT 'pending_verification',
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);        // Create index on tax_id for faster lookups (if not exists)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_companies_tax_id" ON "companies"("tax_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index first
        await queryRunner.query(`DROP INDEX "idx_companies_tax_id"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "companies"`);
        
        // Drop enum types
        await queryRunner.query(`DROP TYPE subscription_tier`);
        await queryRunner.query(`DROP TYPE company_type`);
    }
}
