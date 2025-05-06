import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("companies")
export class Company {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("varchar", { length: 255 })
    name: string;

    @Column("varchar", { length: 50 })
    type: 'dealer' | 'supplier';

    @Column("varchar", { length: 20, unique: true })
    tax_id: string;

    @Column("varchar", { length: 100 })
    business_license: string;

    @Column("jsonb")
    address: {
        street: string;
        city: string;
        province: string;
        postalCode: string;
    };

    @Column("varchar", { length: 100, nullable: true })
    business_category: string;

    @Column("integer", { nullable: true })
    employee_count: number;

    @Column("integer", { nullable: true })
    year_established: number;

    @Column("varchar", { length: 20 })
    contact_phone: string;

    @Column("varchar", { length: 50, default: 'free' })
    subscription_tier: 'free' | 'basic' | 'premium';

    @Column("varchar", { length: 50, default: "pending_verification" })
    status: 'pending_verification' | 'active' | 'suspended' | 'rejected';

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}