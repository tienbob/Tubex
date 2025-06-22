import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { Product } from "./product";
import { Company } from "./company";
import { User } from "./user";

export enum PricingType {
    BASE = 'base',
    WHOLESALE = 'wholesale', 
    RETAIL = 'retail',
    PREMIUM = 'premium',
    DEALER = 'dealer',
    BULK = 'bulk',
    PROMOTIONAL = 'promotional'
}

/**
 * Unified Product Pricing System
 * Replaces both PriceList/PriceListItem and ProductPriceHistory functionality
 */
@Entity("product_pricing")
@Index(["product_id", "company_id", "pricing_type", "is_active"])
@Index(["company_id", "effective_from", "effective_to"])
export class ProductPricing {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    product_id: string;

    @ManyToOne(() => Product, { onDelete: "CASCADE" })
    @JoinColumn({ name: "product_id" })
    product: Product;

    @Column()
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;

    @Column({ type: "enum", enum: PricingType, default: PricingType.BASE })
    pricing_type: PricingType;

    @Column({ type: "decimal", precision: 12, scale: 2 })
    price: number;

    @Column({ length: 3, default: 'USD' })
    currency: string;

    @Column({ type: "integer", nullable: true, comment: "Minimum quantity for this price tier" })
    min_quantity: number;

    @Column({ type: "integer", nullable: true, comment: "Maximum quantity for this price tier" })
    max_quantity: number;

    @Column({ type: "decimal", precision: 5, scale: 2, default: 0, comment: "Additional discount percentage" })
    discount_percentage: number;

    @Column({ type: "date", nullable: true })
    effective_from: Date;

    @Column({ type: "date", nullable: true })
    effective_to: Date;

    @Column({ default: true })
    is_active: boolean;

    @Column()
    created_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by_id" })
    created_by: User;

    @Column({ type: "jsonb", nullable: true, comment: "Custom pricing rules and metadata" })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;

    @UpdateDateColumn()
    updated_at: Date;
}
