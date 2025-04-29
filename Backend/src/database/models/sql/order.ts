import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn } from "typeorm";
import { User } from "./user";
import { Product } from "./product";

export enum OrderStatus {
    PENDING = 'pending',
    CONFIRMED = 'confirmed',
    PROCESSING = 'processing',
    SHIPPED = 'shipped',
    DELIVERED = 'delivered',
    CANCELLED = 'cancelled'
}

export enum PaymentStatus {
    PENDING = 'pending',
    PAID = 'paid',
    FAILED = 'failed',
    REFUNDED = 'refunded'
}

@Entity("orders")
export class Order {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @Column()
    customerId: string;

    @Column({
        type: "enum",
        enum: OrderStatus,
        default: OrderStatus.PENDING
    })
    status: OrderStatus;

    @Column({
        type: "enum",
        enum: PaymentStatus,
        default: PaymentStatus.PENDING
    })
    paymentStatus: PaymentStatus;

    @Column({ type: "varchar", nullable: true })
    paymentMethod: string;

    @Column("decimal", { precision: 10, scale: 2 })
    totalAmount: number;

    @Column({ type: "jsonb", nullable: true })
    deliveryAddress: {
        street: string;
        city: string;
        province: string;
        postalCode: string;
    };

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @OneToMany(() => OrderItem, item => item.order, { cascade: true })
    items: OrderItem[];

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;
}

@Entity("order_items")
export class OrderItem {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Order, order => order.items)
    @JoinColumn({ name: "orderId" })
    order: Order;

    @Column()
    orderId: string;

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

    @Column({ type: "jsonb", nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    createdAt: Date;
}