import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePriceListTables1729730000000 implements MigrationInterface {
    name = 'RemovePriceListTables1729730000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "price_list_item" CASCADE;`);
        await queryRunner.query(`DROP TABLE IF EXISTS "price_list" CASCADE;`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No rollback logic provided.
    }
}