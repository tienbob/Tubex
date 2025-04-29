import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey, TableColumn } from "typeorm";

export class AddWarehouseAndBatchTables1682400002000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create warehouses table
        await queryRunner.createTable(
            new Table({
                name: "warehouses",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()",
                    },
                    {
                        name: "name",
                        type: "varchar",
                        length: "255",
                    },
                    {
                        name: "address",
                        type: "text",
                        isNullable: true,
                    },
                    {
                        name: "company_id",
                        type: "uuid",
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "50",
                        default: "'active'",
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Create batches table
        await queryRunner.createTable(
            new Table({
                name: "batches",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()",
                    },
                    {
                        name: "batch_number",
                        type: "varchar",
                        length: "100",
                    },
                    {
                        name: "product_id",
                        type: "uuid",
                    },
                    {
                        name: "warehouse_id",
                        type: "uuid",
                    },
                    {
                        name: "quantity",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                    },
                    {
                        name: "unit",
                        type: "varchar",
                        length: "50",
                    },
                    {
                        name: "manufacturing_date",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "expiry_date",
                        type: "timestamp",
                        isNullable: true,
                    },
                    {
                        name: "metadata",
                        type: "jsonb",
                        isNullable: true,
                    },
                    {
                        name: "status",
                        type: "varchar",
                        length: "50",
                        default: "'active'",
                    },
                    {
                        name: "created_at",
                        type: "timestamp",
                        default: "now()",
                    },
                    {
                        name: "updated_at",
                        type: "timestamp",
                        default: "now()",
                    },
                ],
            }),
            true
        );

        // Add columns to inventory table
        await queryRunner.addColumns("inventory", [
            new TableColumn({
                name: "warehouse_id",
                type: "uuid",
                isNullable: false
            }),
            new TableColumn({
                name: "reorder_point",
                type: "decimal",
                precision: 10,
                scale: 2,
                isNullable: true
            }),
            new TableColumn({
                name: "reorder_quantity",
                type: "decimal",
                precision: 10,
                scale: 2,
                isNullable: true
            }),
            new TableColumn({
                name: "auto_reorder",
                type: "boolean",
                default: false,
                isNullable: false
            }),
            new TableColumn({
                name: "last_reorder_date",
                type: "timestamp",
                isNullable: true
            }),
            new TableColumn({
                name: "metadata",
                type: "jsonb",
                isNullable: true
            })
        ]);

        // Add indexes
        await queryRunner.createIndex(
            "warehouses",
            new TableIndex({
                name: "idx_warehouse_company",
                columnNames: ["company_id"],
            })
        );

        await queryRunner.createIndex(
            "batches",
            new TableIndex({
                name: "idx_batch_product",
                columnNames: ["product_id"],
            })
        );

        await queryRunner.createIndex(
            "batches",
            new TableIndex({
                name: "idx_batch_warehouse",
                columnNames: ["warehouse_id"],
            })
        );

        await queryRunner.createIndex(
            "inventory",
            new TableIndex({
                name: "idx_inventory_warehouse",
                columnNames: ["warehouse_id"],
            })
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            "warehouses",
            new TableForeignKey({
                columnNames: ["company_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "companies",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "batches",
            new TableForeignKey({
                columnNames: ["product_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "products",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "batches",
            new TableForeignKey({
                columnNames: ["warehouse_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "warehouses",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "inventory",
            new TableForeignKey({
                columnNames: ["warehouse_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "warehouses",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.dropForeignKey("inventory", "FK_inventory_warehouse_id");
        await queryRunner.dropForeignKey("batches", "FK_batches_warehouse_id");
        await queryRunner.dropForeignKey("batches", "FK_batches_product_id");
        await queryRunner.dropForeignKey("warehouses", "FK_warehouses_company_id");

        // Drop indexes
        await queryRunner.dropIndex("inventory", "idx_inventory_warehouse");
        await queryRunner.dropIndex("batches", "idx_batch_warehouse");
        await queryRunner.dropIndex("batches", "idx_batch_product");
        await queryRunner.dropIndex("warehouses", "idx_warehouse_company");

        // Drop columns from inventory
        await queryRunner.dropColumn("inventory", "warehouse_id");
        await queryRunner.dropColumn("inventory", "reorder_point");
        await queryRunner.dropColumn("inventory", "reorder_quantity");
        await queryRunner.dropColumn("inventory", "auto_reorder");
        await queryRunner.dropColumn("inventory", "last_reorder_date");
        await queryRunner.dropColumn("inventory", "metadata");

        // Drop tables
        await queryRunner.dropTable("batches");
        await queryRunner.dropTable("warehouses");
    }
}