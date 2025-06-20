import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAuditLogTable1684000009000 implements MigrationInterface {
    name = 'CreateUserAuditLogTable1684000009000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create user audit logs table
        await queryRunner.query(`
            CREATE TABLE "user_audit_logs" (
                "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                "target_user_id" UUID NOT NULL REFERENCES users(id),
                "performed_by_id" UUID NOT NULL REFERENCES users(id),
                "action" VARCHAR(50) NOT NULL,
                "changes" JSONB NOT NULL,
                "reason" TEXT,
                "created_at" TIMESTAMP NOT NULL DEFAULT now()
            )
        `);

        // Create indices
        await queryRunner.query(`CREATE INDEX "idx_user_audit_logs_target" ON "user_audit_logs"("target_user_id")`);
        await queryRunner.query(`CREATE INDEX "idx_user_audit_logs_performer" ON "user_audit_logs"("performed_by_id")`);
        await queryRunner.query(`CREATE INDEX "idx_user_audit_logs_action" ON "user_audit_logs"("action")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indices
        await queryRunner.query(`DROP INDEX "idx_user_audit_logs_action"`);
        await queryRunner.query(`DROP INDEX "idx_user_audit_logs_performer"`);
        await queryRunner.query(`DROP INDEX "idx_user_audit_logs_target"`);
        
        // Drop table
        await queryRunner.query(`DROP TABLE "user_audit_logs"`);
    }
}
