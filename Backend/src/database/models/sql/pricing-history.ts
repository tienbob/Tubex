import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn, Index } from "typeorm";
import { ProductPricing } from "./product-pricing";
import { User } from "./user";

export enum PricingAction {
    CREATED = 'created',
    UPDATED = 'updated', 
    DELETED = 'deleted',
    ACTIVATED = 'activated',
    DEACTIVATED = 'deactivated',
    BULK_IMPORT = 'bulk_import',
    PROMOTIONAL_START = 'promotional_start',
    PROMOTIONAL_END = 'promotional_end'
}

/**
 * Comprehensive audit trail for all pricing changes
 * Replaces ProductPriceHistory with more detailed tracking
 */
@Entity("pricing_history")
@Index(["product_pricing_id", "changed_at"])
@Index(["changed_by_id", "changed_at"])
@Index(["action", "changed_at"])
export class PricingHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string;    @Column({ nullable: true, comment: "Reference to ProductPricing record, null for deletions" })
    product_pricing_id: string | null;

    @ManyToOne(() => ProductPricing, { onDelete: "SET NULL" })
    @JoinColumn({ name: "product_pricing_id" })
    product_pricing: ProductPricing;

    @Column({ type: "enum", enum: PricingAction })
    action: PricingAction;

    @Column({ type: "jsonb", nullable: true, comment: "Previous state before change" })
    old_values: Record<string, any>;

    @Column({ type: "jsonb", nullable: true, comment: "New state after change" })
    new_values: Record<string, any>;

    @Column()
    changed_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "changed_by_id" })
    changed_by: User;

    @Column({ type: "text", nullable: true })
    reason: string;

    @Column({ type: "jsonb", nullable: true, comment: "Additional context like batch info, source system, etc." })
    metadata: Record<string, any>;

    @CreateDateColumn()
    changed_at: Date;
}
