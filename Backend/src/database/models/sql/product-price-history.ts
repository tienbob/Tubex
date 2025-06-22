import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./product";
import { User } from "./user";

/**
 * ProductPriceHistory entity tracks all historical prices of products
 */
@Entity("product_price_history")
export class ProductPriceHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    product_id: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product: Product;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    old_price: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    new_price: number;

    @Column({ name: "changed_by_id" })
    changed_by_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "changed_by_id" })
    user: User;

    @Column({ type: "text", nullable: true })
    reason: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;
}
