import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm";

@Entity("companies")
export class Company {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("varchar", { length: 255 })
    name: string;

    @Column("varchar", { length: 50 })
    type: 'dealer' | 'supplier';

    @Column("varchar", { length: 50, default: 'free' })
    subscription_tier: 'free' | 'basic' | 'premium';

    @Column("varchar", { length: 50, default: "active" })
    status: string;

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}