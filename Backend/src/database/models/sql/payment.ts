import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./order";
import { Invoice } from "./invoice";
import { User } from "./user";

export enum PaymentMethod {
    CREDIT_CARD = 'credit_card',
    BANK_TRANSFER = 'bank_transfer',
    CASH = 'cash',
    CHECK = 'check',
    PAYPAL = 'paypal',
    STRIPE = 'stripe',
    OTHER = 'other'
}

export enum PaymentType {
    ORDER_PAYMENT = 'order_payment',
    INVOICE_PAYMENT = 'invoice_payment',
    REFUND = 'refund',
    ADVANCE_PAYMENT = 'advance_payment',
    ADJUSTMENT = 'adjustment'
}

export enum PaymentReconciliationStatus {
    UNRECONCILED = 'unreconciled',
    RECONCILED = 'reconciled',
    DISPUTED = 'disputed',
    PENDING_REVIEW = 'pending_review'
}

@Entity("payments")
export class Payment {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column({ unique: true })
    transactionId: string;

    @Column({ nullable: true })
    orderId: string;

    @ManyToOne(() => Order, { nullable: true })
    @JoinColumn({ name: "orderId" })
    order: Order;

    @Column({ nullable: true })
    invoiceId: string;

    @ManyToOne(() => Invoice, { nullable: true })
    @JoinColumn({ name: "invoiceId" })
    invoice: Invoice;

    @Column()
    customerId: string;

    @Column("decimal", { precision: 10, scale: 2 })
    amount: number;

    @Column({
        type: "enum",
        enum: PaymentMethod,
        default: PaymentMethod.BANK_TRANSFER
    })
    paymentMethod: PaymentMethod;

    @Column({
        type: "enum",
        enum: PaymentType,
        default: PaymentType.INVOICE_PAYMENT
    })
    paymentType: PaymentType;

    @Column({ type: 'timestamp' })
    paymentDate: Date;

    @Column({ nullable: true })
    externalReferenceId: string;

    @Column({ nullable: true, type: 'text' })
    notes: string;

    @Column({
        type: "enum",
        enum: PaymentReconciliationStatus,
        default: PaymentReconciliationStatus.UNRECONCILED
    })
    reconciliationStatus: PaymentReconciliationStatus;

    @Column({ type: 'timestamp', nullable: true })
    reconciliationDate: Date;

    @Column({ nullable: true })
    reconciledById: string;

    @ManyToOne(() => User, { nullable: true })
    @JoinColumn({ name: "reconciledById" })
    reconciledBy: User;

    @Column({ type: "json", nullable: true })
    metadata: Record<string, any>;

    @ManyToOne(() => User)
    @JoinColumn({ name: "recordedById" })
    recordedBy: User;

    @Column()
    recordedById: string;
    
    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}
