import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class EnhanceWarehouseTable1683400000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add new fields to warehouses table
        await queryRunner.addColumns("warehouses", [
            new TableColumn({
                name: "capacity",
                type: "decimal",
                precision: 10,
                scale: 2,
                isNullable: true
            }),
            new TableColumn({
                name: "contact_info",
                type: "jsonb",
                isNullable: true
            }),
            new TableColumn({
                name: "type",
                type: "varchar",
                length: "50",
                default: "'storage'"
            }),
            new TableColumn({
                name: "notes",
                type: "text",
                isNullable: true
            })
        ]);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove added columns if migration needs to be reverted
        await queryRunner.dropColumn("warehouses", "capacity");
        await queryRunner.dropColumn("warehouses", "contact_info");
        await queryRunner.dropColumn("warehouses", "type");
        await queryRunner.dropColumn("warehouses", "notes");
    }
}
