import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user";
import { Product } from "./product";

export enum QuoteStatus {
    DRAFT = 'draft',
    PENDING = 'pending',
    ACCEPTED = 'accepted',
    REJECTED = 'rejected',
    EXPIRED = 'expired',
    CONVERTED = 'converted'
}

@Entity("quotes")
export class Quote {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    customerId: string;

    @Column({ unique: true })
    quoteNumber: string;

    @Column({
        type: "enum",
        enum: QuoteStatus,
        default: QuoteStatus.DRAFT
    })
    status: QuoteStatus;

    @Column("decimal", { precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: "jsonb", nullable: true })
    deliveryAddress: {
        street: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
    };

    @Column({ type: "date", nullable: true })
    validUntil: Date;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => QuoteItem, item => item.quote, { cascade: true })
    items: QuoteItem[];

    @ManyToOne(() => User)
    @JoinColumn({ name: "createdById" })
    createdBy: User;

    @Column()
    createdById: string;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity("quote_items")
export class QuoteItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Quote, quote => quote.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "quoteId" })
    quote: Quote;

    @Column()
    quoteId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "productId" })
    product: Product;

    @Column()
    productId: string;

    @Column("decimal", { precision: 10, scale: 2 })
    quantity: number;

    @Column("decimal", { precision: 10, scale: 2 })
    unitPrice: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
