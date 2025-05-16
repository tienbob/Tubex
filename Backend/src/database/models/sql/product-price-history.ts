import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Product } from "./product";
import { User } from "./user";
import { PriceList } from "./price-list";

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

    @Column({ nullable: true })
    price_list_id: string;

    @ManyToOne(() => PriceList, { nullable: true })
    @JoinColumn({ name: "price_list_id" })
    price_list: PriceList;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    old_price: number;

    @Column({ type: "decimal", precision: 10, scale: 2 })
    new_price: number;

    @Column()
    created_by: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by" })
    user: User;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: "effective_date" })
    effective_date: Date;
}
