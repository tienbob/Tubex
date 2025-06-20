import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user";
import { Product } from "./product";
import { Company } from "./company";

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

    @Column({ name: "customer_id" })
    customerId: string;

    @Column({ unique: true, name: "quote_number" })
    quoteNumber: string;

    @Column({
        type: "enum",
        enum: QuoteStatus,
        default: QuoteStatus.DRAFT    })
    status: QuoteStatus;

    @Column("decimal", { precision: 10, scale: 2, name: "total_amount" })
    totalAmount: number;

    @Column({ type: "date", name: "valid_until" })
    validUntil: Date;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => QuoteItem, item => item.quote, { cascade: true })
    items: QuoteItem[];

    @ManyToOne(() => User)
    @JoinColumn({ name: "created_by_id" })
    createdBy: User;

    @Column({ name: "created_by_id" })
    createdById: string;

    // Add company relationship and column that was missing
    @ManyToOne(() => Company)
    @JoinColumn({ name: "company_id" })
    company: Company;

    @Column({ name: "company_id" })
    companyId: string;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}

@Entity("quote_items")
export class QuoteItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Quote, quote => quote.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "quote_id" })
    quote: Quote;

    @Column({ name: "quote_id" })
    quoteId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "product_id" })
    product: Product;    @Column({ name: "product_id" })
    productId: string;

    @Column({ nullable: true })
    description: string;

    @Column("decimal", { precision: 10, scale: 2 })
    quantity: number;

    @Column("decimal", { precision: 10, scale: 2, name: "unit_price" })
    unitPrice: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: "created_at" })
    createdAt: Date;

    @UpdateDateColumn({ name: "updated_at" })
    updatedAt: Date;
}
