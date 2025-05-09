import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOrderHistory1682400005000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "order_history" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "order_id" uuid NOT NULL,
                "user_id" uuid NOT NULL,
                "previous_status" varchar(50) NOT NULL,
                "new_status" varchar(50) NOT NULL,
                "notes" text,
                "metadata" jsonb,
                "created_at" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "pk_order_history" PRIMARY KEY ("id")
            );

            CREATE INDEX "idx_order_history_order" ON "order_history" ("order_id");
            CREATE INDEX "idx_order_history_user" ON "order_history" ("user_id");
            CREATE INDEX "idx_order_history_created_at" ON "order_history" ("created_at");

            ALTER TABLE "order_history" ADD CONSTRAINT "fk_order_history_order"
                FOREIGN KEY ("order_id") REFERENCES "orders"("id") ON DELETE CASCADE;
            
            ALTER TABLE "order_history" ADD CONSTRAINT "fk_order_history_user"
                FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            DROP TABLE "order_history";
        `);
    }
}