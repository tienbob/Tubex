import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1682400000000 implements MigrationInterface {
    name = 'InitialSchema1682400000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE company_type AS ENUM ('dealer', 'supplier');
            CREATE TYPE subscription_tier AS ENUM ('free', 'basic', 'premium');
            CREATE TYPE user_role AS ENUM ('admin', 'manager', 'staff');
            
            CREATE TABLE "companies" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR NOT NULL,
                "type" company_type NOT NULL,
                "subscription_tier" subscription_tier NOT NULL DEFAULT 'free',
                "status" VARCHAR NOT NULL DEFAULT 'active',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE TABLE "users" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "email" VARCHAR NOT NULL UNIQUE,
                "password_hash" VARCHAR NOT NULL,
                "role" user_role NOT NULL,
                "status" VARCHAR NOT NULL DEFAULT 'active',
                "company_id" UUID REFERENCES companies(id),
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE TABLE "products" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "name" VARCHAR NOT NULL,
                "description" TEXT,
                "base_price" DECIMAL(10,2) NOT NULL,
                "unit" VARCHAR NOT NULL,
                "supplier_id" UUID REFERENCES companies(id),
                "status" VARCHAR NOT NULL DEFAULT 'active',
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                "updated_at" TIMESTAMP NOT NULL DEFAULT now()
            );

            CREATE INDEX "idx_users_email" ON "users"("email");
            CREATE INDEX "idx_users_company" ON "users"("company_id");
            CREATE INDEX "idx_products_supplier" ON "products"("supplier_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP INDEX "idx_products_supplier";
            DROP INDEX "idx_users_company";
            DROP INDEX "idx_users_email";
            DROP TABLE "products";
            DROP TABLE "users";
            DROP TABLE "companies";
            DROP TYPE user_role;
            DROP TYPE subscription_tier;
            DROP TYPE company_type;
        `);
    }
}