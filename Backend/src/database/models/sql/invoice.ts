import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user";
import { Order } from "./order";
import { Product } from "./product";

export enum InvoiceStatus {
    DRAFT = 'draft',
    SENT = 'sent',
    VIEWED = 'viewed',
    PAID = 'paid',
    PARTIALLY_PAID = 'partially_paid',
    OVERDUE = 'overdue',
    VOID = 'void'
}

export enum PaymentTerm {
    IMMEDIATE = 'immediate',
    DAYS_7 = 'net7',
    DAYS_15 = 'net15',
    DAYS_30 = 'net30',
    DAYS_45 = 'net45',
    DAYS_60 = 'net60',
    DAYS_90 = 'net90'
}

@Entity("invoices")
export class Invoice {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    invoiceNumber: string;

    @Column()
    customerId: string;

    @Column({
        type: "enum",
        enum: InvoiceStatus,
        default: InvoiceStatus.DRAFT
    })
    status: InvoiceStatus;

    @Column("decimal", { precision: 10, scale: 2 })
    totalAmount: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    paidAmount: number;

    @Column({ nullable: true })
    orderId: string;

    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: "orderId" })
    order: Order;

    @Column({
        type: "enum",
        enum: PaymentTerm,
        default: PaymentTerm.DAYS_30
    })
    paymentTerm: PaymentTerm;

    @Column({ type: "date" })
    issueDate: Date;

    @Column({ type: "date" })
    dueDate: Date;

    @Column({ type: "jsonb", nullable: true })
    billingAddress: {
        street: string;
        city: string;
        province: string;
        postalCode: string;
        country: string;
    };

    @Column({ nullable: true })
    notes: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => InvoiceItem, item => item.invoice, { cascade: true })
    items: InvoiceItem[];

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

@Entity("invoice_items")
export class InvoiceItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Invoice, invoice => invoice.items, { onDelete: 'CASCADE' })
    @JoinColumn({ name: "invoiceId" })
    invoice: Invoice;

    @Column()
    invoiceId: string;

    @ManyToOne(() => Product)
    @JoinColumn({ name: "productId" })
    product: Product;

    @Column()
    productId: string;

    @Column({ nullable: true })
    description: string;

    @Column("decimal", { precision: 10, scale: 2 })
    quantity: number;

    @Column("decimal", { precision: 10, scale: 2 })
    unitPrice: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    discount: number;

    @Column("decimal", { precision: 10, scale: 2, default: 0 })
    tax: number;

    @Column({ nullable: true })
    notes: string;

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
