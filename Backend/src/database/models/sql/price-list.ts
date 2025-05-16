import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne, JoinColumn } from "typeorm";
import { PriceListItem } from "./price-list-item";
import { Company } from "./company";

export enum PriceListStatus {
    ACTIVE = 'active',
    INACTIVE = 'inactive',
    ARCHIVED = 'archived',
    DRAFT = 'draft'
}

/**
 * PriceList entity represents a collection of prices (e.g., Standard, Wholesale, Premium)
 */
@Entity("price_lists")
export class PriceList {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ length: 100 })
    name: string;

    @Column({ type: "text", nullable: true })
    description: string;

    @Column()
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;

    @Column({ type: "enum", enum: PriceListStatus, default: PriceListStatus.DRAFT })
    status: PriceListStatus;

    @Column({ type: "date", nullable: true })
    effective_from: Date;

    @Column({ type: "date", nullable: true })
    effective_to: Date;

    @Column({ default: 0 })
    is_default: boolean;

    @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
    global_discount_percentage: number;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => PriceListItem, item => item.price_list)
    items: PriceListItem[];

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
