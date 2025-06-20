import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePaymentTable1742098765432 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.createTable(
            new Table({
                name: "payments",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "uuid_generate_v4()"
                    },
                    {
                        name: "transactionId",
                        type: "varchar",
                        isUnique: true
                    },
                    {
                        name: "orderId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "invoiceId",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "customerId",
                        type: "varchar",
                        isNullable: false
                    },
                    {
                        name: "amount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "paymentMethod",
                        type: "enum",
                        enum: ["credit_card", "bank_transfer", "cash", "check", "paypal", "stripe", "other"],
                        default: "'bank_transfer'"
                    },
                    {
                        name: "paymentType",
                        type: "enum",
                        enum: ["order_payment", "invoice_payment", "refund", "advance_payment", "adjustment"],
                        default: "'invoice_payment'"
                    },
                    {
                        name: "paymentDate",
                        type: "timestamp",
                        isNullable: false
                    },
                    {
                        name: "externalReferenceId",
                        type: "varchar",
                        isNullable: true
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "reconciliationStatus",
                        type: "enum",
                        enum: ["unreconciled", "reconciled", "disputed", "pending_review"],
                        default: "'unreconciled'"
                    },
                    {
                        name: "reconciliationDate",
                        type: "timestamp",
                        isNullable: true
                    },
                    {
                        name: "reconciledById",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true
                    },
                    {
                        name: "recordedById",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()"
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        // Add foreign key constraints
        await queryRunner.createForeignKey(
            "payments",
            new TableForeignKey({
                columnNames: ["orderId"],
                referencedColumnNames: ["id"],
                referencedTableName: "orders",
                onDelete: "SET NULL"
            })
        );

        await queryRunner.createForeignKey(
            "payments",
            new TableForeignKey({
                columnNames: ["invoiceId"],
                referencedColumnNames: ["id"],
                referencedTableName: "invoices",
                onDelete: "SET NULL"
            })
        );

        await queryRunner.createForeignKey(
            "payments",
            new TableForeignKey({
                columnNames: ["recordedById"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "RESTRICT"
            })
        );

        await queryRunner.createForeignKey(
            "payments",
            new TableForeignKey({
                columnNames: ["reconciledById"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "RESTRICT"
            })
        );

        // Create indices for better performance
        await queryRunner.query(`
            CREATE INDEX idx_payment_order ON payments ("orderId");
            CREATE INDEX idx_payment_invoice ON payments ("invoiceId");
            CREATE INDEX idx_payment_customer ON payments ("customerId");
            CREATE INDEX idx_payment_reconciliation ON payments ("reconciliationStatus");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const table = await queryRunner.getTable("payments");
        const foreignKeys = table?.foreignKeys;
        
        if (foreignKeys) {
            for (const foreignKey of foreignKeys) {
                await queryRunner.dropForeignKey("payments", foreignKey);
            }
        }
        
        await queryRunner.query(`
            DROP INDEX IF EXISTS idx_payment_order;
            DROP INDEX IF EXISTS idx_payment_invoice;
            DROP INDEX IF EXISTS idx_payment_customer;
            DROP INDEX IF EXISTS idx_payment_reconciliation;
        `);
        
        await queryRunner.dropTable("payments");
    }
}
