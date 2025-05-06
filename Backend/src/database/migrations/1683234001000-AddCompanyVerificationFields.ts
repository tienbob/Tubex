import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

export class AddCompanyVerificationFields1683234001000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add verification fields to companies table
        await queryRunner.addColumns("companies", [
            new TableColumn({
                name: "tax_id",
                type: "varchar",
                length: "20",
                isNullable: false,
                isUnique: true
            }),
            new TableColumn({
                name: "business_license",
                type: "varchar",
                length: "100",
                isNullable: false
            }),
            new TableColumn({
                name: "address",
                type: "jsonb",
                isNullable: false
            }),
            new TableColumn({
                name: "business_category",
                type: "varchar",
                length: "100",
                isNullable: true
            }),
            new TableColumn({
                name: "employee_count",
                type: "integer",
                isNullable: true
            }),
            new TableColumn({
                name: "year_established",
                type: "integer",
                isNullable: true
            }),
            new TableColumn({
                name: "contact_phone",
                type: "varchar",
                length: "20",
                isNullable: false
            })
        ]);

        // Create index on tax_id for faster lookups
        await queryRunner.query(`
            CREATE INDEX "idx_companies_tax_id" ON "companies"("tax_id");
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop the index first
        await queryRunner.query(`DROP INDEX "idx_companies_tax_id";`);

        // Remove the columns
        await queryRunner.dropColumns("companies", [
            "tax_id",
            "business_license",
            "address",
            "business_category",
            "employee_count",
            "year_established",
            "contact_phone"
        ]);
    }
}