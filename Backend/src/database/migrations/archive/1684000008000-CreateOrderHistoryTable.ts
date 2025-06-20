import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOrderHistoryTable1684000008000 implements MigrationInterface {
    name = 'CreateOrderHistoryTable1684000008000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create order history table
        await queryRunner.query(`
            CREATE TABLE "order_history" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "order_id" UUID NOT NULL REFERENCES orders(id),
                "user_id" UUID NOT NULL REFERENCES users(id),
                "previous_status" VARCHAR(50) NOT NULL,
                "new_status" VARCHAR(50) NOT NULL,
                "notes" TEXT,
                "metadata" JSONB,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_order_history_order" ON "order_history"("order_id")`);
        await queryRunner.query(`CREATE INDEX "idx_order_history_user" ON "order_history"("user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_order_history_created_at" ON "order_history"("created_at")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_order_history_created_at"`);
        await queryRunner.query(`DROP INDEX "idx_order_history_user"`);
        await queryRunner.query(`DROP INDEX "idx_order_history_order"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "order_history"`);
    }
}
