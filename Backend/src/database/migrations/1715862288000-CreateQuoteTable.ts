import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateQuoteTable1715862288000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create quote table
        await queryRunner.createTable(
            new Table({
                name: "quotes",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "customerId",
                        type: "uuid",
                    },
                    {
                        name: "quoteNumber",
                        type: "varchar",
                        isUnique: true,
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["draft", "pending", "accepted", "rejected", "expired", "converted"],
                        default: "'draft'",
                    },
                    {
                        name: "totalAmount",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "deliveryAddress",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "validUntil",
                        type: "date",
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

        // Create quote items table
        await queryRunner.createTable(
            new Table({
                name: "quote_items",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "quoteId",
                        type: "uuid",
                    },
                    {
                        name: "productId",
                        type: "uuid",
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
            "quotes",
            new TableForeignKey({
                columnNames: ["customerId"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "RESTRICT",
            })
        );

        await queryRunner.createForeignKey(
            "quotes",
            new TableForeignKey({
                columnNames: ["createdById"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "RESTRICT",
            })
        );

        await queryRunner.createForeignKey(
            "quote_items",
            new TableForeignKey({
                columnNames: ["quoteId"],
                referencedColumnNames: ["id"],
                referencedTableName: "quotes",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "quote_items",
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
        const quoteItemsTable = await queryRunner.getTable("quote_items");
        const quotesTable = await queryRunner.getTable("quotes");
        
        if (quoteItemsTable) {
            const quoteIdFk = quoteItemsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("quoteId") !== -1
            );
            const productIdFk = quoteItemsTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("productId") !== -1
            );
            
            if (quoteIdFk) {
                await queryRunner.dropForeignKey("quote_items", quoteIdFk);
            }
            if (productIdFk) {
                await queryRunner.dropForeignKey("quote_items", productIdFk);
            }
        }
        
        if (quotesTable) {
            const customerIdFk = quotesTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("customerId") !== -1
            );
            const createdByIdFk = quotesTable.foreignKeys.find(
                fk => fk.columnNames.indexOf("createdById") !== -1
            );
            
            if (customerIdFk) {
                await queryRunner.dropForeignKey("quotes", customerIdFk);
            }
            if (createdByIdFk) {
                await queryRunner.dropForeignKey("quotes", createdByIdFk);
            }
        }

        // Drop tables
        await queryRunner.dropTable("quote_items");
        await queryRunner.dropTable("quotes");
    }
}
