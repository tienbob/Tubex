import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Product, Company, Warehouse } from "./index";

@Entity("inventory")
export class Inventory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    @Index()
    product: Product;

    @Column()
    product_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    @Index()
    company: Company;

    @Column()
    company_id: string;

    @ManyToOne(() => Warehouse)
    @JoinColumn({ name: "warehouse_id" })
    @Index()
    warehouse: Warehouse;

    @Column()
    warehouse_id: string;

    @Column("decimal", { precision: 10, scale: 2 })
    quantity: number;

    @Column("varchar", { length: 50 })
    unit: string;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    min_threshold: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    max_threshold: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    reorder_point: number;

    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    reorder_quantity: number;

    @Column("boolean", { default: false })
    auto_reorder: boolean;

    @Column("timestamp", { nullable: true })
    last_reorder_date: Date;

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @Column("varchar", { length: 50, default: "active" })
    status: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}