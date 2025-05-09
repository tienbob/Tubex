import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from "typeorm";
import { Company } from "./index";
import { Inventory } from "./inventory";

@Entity("warehouses")
export class Warehouse {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column("varchar", { length: 255 })
    name: string;

    @Column("text", { nullable: true })
    address: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;

    @Column()
    company_id: string;
    
    @Column("decimal", { precision: 10, scale: 2, nullable: true })
    capacity: number;
    
    @Column("jsonb", { nullable: true })
    contact_info: {
        name?: string;
        phone?: string;
        email?: string;
    };
    
    @Column("varchar", { length: 50, default: "storage" })
    type: "main" | "secondary" | "distribution" | "storage";
      @Column("varchar", { length: 50, default: "active" })
    status: "active" | "inactive" | "under_maintenance";
    
    @Column("text", { nullable: true })
    notes: string;

    @OneToMany(() => Inventory, inventory => inventory.warehouse)
    inventoryItems: Inventory[];

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}