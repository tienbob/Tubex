import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateInventoryTable1682400001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create inventory table
        await queryRunner.createTable(
            new Table({
                name: "inventory",
                columns: [
                    {
                        name: "id",
                        type: "uuid",
                        isPrimary: true,
                        generationStrategy: "uuid",
                        default: "gen_random_uuid()",
                    },
                    {
                        name: "product_id",
                        type: "uuid",
                    },
                    {
                        name: "company_id",
                        type: "uuid",
                    },
                    {
                        name: "quantity",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        default: 0,
                    },
                    {
                        name: "unit",
                        type: "varchar",
                        length: "50",
                    },
                    {
                        name: "min_threshold",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
                        isNullable: true,
                    },
                    {
                        name: "max_threshold",
                        type: "decimal",
                        precision: 10,
                        scale: 2,
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

        // Add indexes
        await queryRunner.createIndex(
            "inventory",
            new TableIndex({
                name: "idx_inventory_product",
                columnNames: ["product_id"],
            })
        );

        await queryRunner.createIndex(
            "inventory",
            new TableIndex({
                name: "idx_inventory_company",
                columnNames: ["company_id"],
            })
        );

        // Add foreign keys
        await queryRunner.createForeignKey(
            "inventory",
            new TableForeignKey({
                columnNames: ["product_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "products",
                onDelete: "CASCADE",
            })
        );

        await queryRunner.createForeignKey(
            "inventory",
            new TableForeignKey({
                columnNames: ["company_id"],
                referencedColumnNames: ["id"],
                referencedTableName: "companies",
                onDelete: "CASCADE",
            })
        );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign keys
        await queryRunner.dropForeignKey("inventory", "FK_inventory_company_id");
        await queryRunner.dropForeignKey("inventory", "FK_inventory_product_id");

        // Drop indexes
        await queryRunner.dropIndex("inventory", "idx_inventory_company");
        await queryRunner.dropIndex("inventory", "idx_inventory_product");

        // Drop table
        await queryRunner.dropTable("inventory");
    }
}