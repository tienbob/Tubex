import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Product, Warehouse } from "./index";

@Entity("batches")
export class Batch {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("varchar", { length: 100 })
    batch_number: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    @Index()
    product: Product;

    @Column()
    product_id: string;

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

    @Column("timestamp", { nullable: true })
    manufacturing_date: Date | null;

    @Column("timestamp", { nullable: true })
    expiry_date: Date | null;

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @Column("varchar", { length: 50, default: "active" })
    status: string;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}