import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class AddUserAuditLogs1683234000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "user_audit_logs",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "target_user_id",
                        type: "uuid"
                    },
                    {
                        name: "performed_by_id",
                        type: "uuid"
                    },
                    {
                        name: "action",
                        type: "varchar",
                        length: "50"
                    },
                    {
                        name: "changes",
                        type: "jsonb"
                    },
                    {
                        name: "reason",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "user_audit_logs",
            new TableForeignKey({
                columnNames: ["target_user_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "user_audit_logs",
            new TableForeignKey({
                columnNames: ["performed_by_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "SET NULL"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("user_audit_logs");
        if (table) {
            const foreignKeys = table.foreignKeys;
            await Promise.all(foreignKeys.map(foreignKey => 
                queryRunner.dropForeignKey("user_audit_logs", foreignKey)
            ));
        }
        await queryRunner.dropTable("user_audit_logs");
    }
}