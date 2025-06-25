import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateInvitationsTable1650000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "invitations",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        isGenerated: true,
                        generationStrategy: "uuid"
                    },
                    {
                        name: "email",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "code",
                        type: "varchar",
                        length: "255",
                        isNullable: false
                    },
                    {
                        name: "role",
                        type: "varchar",
                        length: "50",
                        isNullable: false
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "50",
                        isNullable: false,
                        default: "'pending'"
                    },
                    {
                        name: "company_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "message",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            })
        );
        await queryRunner.createForeignKey(
            "invitations",
            new TableForeignKey({
                columnNames: ["company_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "companies",
                onDelete: "CASCADE"
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.dropTable("invitations");
    }
}
