import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { PriceList } from "./price-list";
import { Product } from "./product";

/**
 * PriceListItem entity represents a specific product price within a price list
 */
@Entity("price_list_items")
export class PriceListItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    price_list_id: string;

    @ManyToOne(() => PriceList, priceList => priceList.items, { onDelete: "CASCADE" })
    @JoinColumn({ name: "price_list_id" })
    price_list: PriceList;

    @Column()
    product_id: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product: Product;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    price: number;

    @Column({ type: "decimal", precision: 5, scale: 2, default: 0 })
    discount_percentage: number;

    @Column({ type: "date", nullable: true })
    effective_from: Date;

    @Column({ type: "date", nullable: true })
    effective_to: Date;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: "created_at" })
    created_at: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updated_at: Date;
}
