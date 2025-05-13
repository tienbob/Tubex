import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserTable1684000001000 implements MigrationInterface {
    name = 'CreateUserTable1684000001000'
    
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if enum exists before creating it
        const enumExists = await queryRunner.query(`
            SELECT EXISTS (
                SELECT 1 FROM pg_type 
                WHERE typname = 'user_role'
            );
        `);
        
        // Create enum only if it doesn't exist
        if (!enumExists[0].exists) {
            await queryRunner.query(`CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff')`);
        }
        
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "users" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "email" VARCHAR NOT NULL UNIQUE,
                "password_hash" VARCHAR NOT NULL,
                "role" user_role NOT NULL,
                "status" VARCHAR NOT NULL DEFAULT 'active',
                "company_id" UUID REFERENCES companies(id),
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_users_email" ON "users"("email")`);
        await queryRunner.query(`CREATE INDEX "idx_users_company" ON "users"("company_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_users_company"`);
        await queryRunner.query(`DROP INDEX "idx_users_email"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "users"`);
        
        // Don't drop the enum as it might be used elsewhere
    }
}
