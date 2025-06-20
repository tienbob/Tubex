import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateInvoiceTable1715862389000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create invoice table
        await queryRunner.createTable(
            new Table({
                name: "invoices",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "invoiceNumber",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "customerId",
                        type: "uuid",
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["draft", "sent", "viewed", "paid", "partially_paid", "overdue", "void"],
                        default: "'draft'",
                    },
                    {
                        name: "totalAmount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "paidAmount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: "orderId",
                        type: "uuid",
                        isNullable: true,
                    },
                    {
                        name: "paymentTerm",
                        type: "enum",
                        enum: ["immediate", "net7", "net15", "net30", "net45", "net60", "net90"],
                        default: "'net30'",
                    },
                    {
                        name: "issueDate",
                        type: "date",
                    },
                    {
                        name: "dueDate",
                        type: "date",
                    },
                    {
                        name: "billingAddress",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "createdById",
                        type: "uuid",
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create invoice items table
        await queryRunner.createTable(
            new Table({
                name: "invoice_items",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "invoiceId",
                        type: "uuid",
                    },
                    {
                        name: "productId",
                        type: "uuid",
                    },
                    {
                        name: "description",
                        type: "varchar",
                        isNullable: true,
                    },
                    {
                        name: "quantity",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "unitPrice",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "discount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: "tax",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: "notes",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "createdAt",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updatedAt",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create foreign key constraints
        await queryRunner.createForeignKey(
            "invoices",
            new TableForeignKey({
                columnNames: ["customerId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "RESTRICT",
            })
        );

        await queryRunner.createForeignKey(
            "invoices",
            new TableForeignKey({
                columnNames: ["orderId"],
                referencedColumnNames: ["id"],
                referencedTableName: "orders",
                onDelete: "RESTRICT",
                onUpdate: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "invoices",
            new TableForeignKey({
                columnNames: ["createdById"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "RESTRICT",
            })
        );

        await queryRunner.createForeignKey(
            "invoice_items",
            new TableForeignKey({
                columnNames: ["invoiceId"],
                referencedColumnNames: ["id"],
                referencedTableName: "invoices",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "invoice_items",
            new TableForeignKey({
                columnNames: ["productId"],
                referencedColumnNames: ["id"],
                referencedTableName: "products",
                onDelete: "RESTRICT",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys first
        const invoiceItemsTable = await queryRunner.getTable("invoice_items");
        const invoicesTable = await queryRunner.getTable("invoices");
        
        if (invoiceItemsTable) {
            const invoiceIdFk = invoiceItemsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("invoiceId") !== -1
            );
            const productIdFk = invoiceItemsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("productId") !== -1
            );
            
            if (invoiceIdFk) {
                await queryRunner.dropForeignKey("invoice_items", invoiceIdFk);
            }
            if (productIdFk) {
                await queryRunner.dropForeignKey("invoice_items", productIdFk);
            }
        }
        
        if (invoicesTable) {
            const customerIdFk = invoicesTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("customerId") !== -1
            );
            const orderIdFk = invoicesTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("orderId") !== -1
            );
            const createdByIdFk = invoicesTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("createdById") !== -1
            );
            
            if (customerIdFk) {
                await queryRunner.dropForeignKey("invoices", customerIdFk);
            }
            if (orderIdFk) {
                await queryRunner.dropForeignKey("invoices", orderIdFk);
            }
            if (createdByIdFk) {
                await queryRunner.dropForeignKey("invoices", createdByIdFk);
            }
        }

        // Drop tables
        await queryRunner.dropTable("invoice_items");
        await queryRunner.dropTable("invoices");
    }
}
