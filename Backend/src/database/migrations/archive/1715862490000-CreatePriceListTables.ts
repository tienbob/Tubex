import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreatePriceListTables1715862490000 implements MigrationInterface {
    name = 'CreatePriceListTables1715862490000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create price_lists table
        await queryRunner.createTable(
            new Table({
                name: "price_lists",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "100",
                        isNullable: false
                    },
                    {
                        name: "description",
                        type: "text",
                        isNullable: true
                    },
                    {
                        name: "company_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "status",
                        type: "enum",
                        enum: ["active", "inactive", "archived", "draft"],
                        default: "'draft'"
                    },
                    {
                        name: "effective_from",
                        type: "date",
                        isNullable: true
                    },
                    {
                        name: "effective_to",
                        type: "date",
                        isNullable: true
                    },
                    {
                        name: "is_default",
                        type: "boolean",
                        default: false
                    },
                    {
                        name: "global_discount_percentage",
                        type: "decimal",
                        precision: 5,
                        scale: 2,
                        default: 0
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
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
            }),
            true
        );

        // Create price_list_items table
        await queryRunner.createTable(
            new Table({
                name: "price_list_items",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "price_list_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "product_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "price",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "discount_percentage",
                        type: "decimal",
                        precision: 5,
                        scale: 2,
                        default: 0
                    },
                    {
                        name: "effective_from",
                        type: "date",
                        isNullable: true
                    },
                    {
                        name: "effective_to",
                        type: "date",
                        isNullable: true
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
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
            }),
            true
        );

        // Create product_price_history table
        await queryRunner.createTable(
            new Table({
                name: "product_price_history",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        default: "uuid_generate_v4()",
                    },
                    {
                        name: "product_id",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "price_list_id",
                        type: "uuid",
                        isNullable: true
                    },
                    {
                        name: "old_price",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "new_price",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: false
                    },
                    {
                        name: "created_by",
                        type: "uuid",
                        isNullable: false
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true
                    },
                    {
                        name: "effective_date",
                        type: "timestamp",
                        default: "now()"
                    }
                ]
            }),
            true
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            "price_lists",
            new TableForeignKey({
                columnNames: ["company_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "companies",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "price_list_items",
            new TableForeignKey({
                columnNames: ["price_list_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "price_lists",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "price_list_items",
            new TableForeignKey({
                columnNames: ["product_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "products",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "product_price_history",
            new TableForeignKey({
                columnNames: ["product_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "products",
                onDelete: "CASCADE"
            })
        );

        await queryRunner.createForeignKey(
            "product_price_history",
            new TableForeignKey({
                columnNames: ["price_list_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "price_lists",
                onDelete: "SET NULL"
            })
        );

        await queryRunner.createForeignKey(
            "product_price_history",
            new TableForeignKey({
                columnNames: ["created_by"],
                referencedColumnNames: ["id"],
                referencedTableName: "users",
                onDelete: "NO ACTION"
            })
        );

        // Create indexes
        await queryRunner.query(`CREATE INDEX "IDX_PRICE_LIST_COMPANY" ON "price_lists" ("company_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRICE_LIST_ITEM_PRODUCT" ON "price_list_items" ("product_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRICE_LIST_ITEM_PRICE_LIST" ON "price_list_items" ("price_list_id")`);
        await queryRunner.query(`CREATE INDEX "IDX_PRODUCT_PRICE_HISTORY_PRODUCT" ON "product_price_history" ("product_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_PRODUCT_PRICE_HISTORY_PRODUCT"`);
        await queryRunner.query(`DROP INDEX "IDX_PRICE_LIST_ITEM_PRICE_LIST"`);
        await queryRunner.query(`DROP INDEX "IDX_PRICE_LIST_ITEM_PRODUCT"`);
        await queryRunner.query(`DROP INDEX "IDX_PRICE_LIST_COMPANY"`);

        // Drop tables
        await queryRunner.dropTable("product_price_history");
        await queryRunner.dropTable("price_list_items");
        await queryRunner.dropTable("price_lists");
    }
}
