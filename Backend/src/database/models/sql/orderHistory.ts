import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm";
import { Order } from "./order";
import { User } from "./user";

@Entity("order_history")
export class OrderHistory {
    @PrimaryGeneratedColumn("uuid")
    id: string;

    @ManyToOne(() => Order)
    @JoinColumn({ name: "order_id" })
    order: Order;

    @Column()
    order_id: string;

    @ManyToOne(() => User)
    @JoinColumn({ name: "user_id" })
    user: User;

    @Column()
    user_id: string;

    @Column("varchar", { length: 50 })
    previous_status: string;

    @Column("varchar", { length: 50 })
    new_status: string;

    @Column("text", { nullable: true })
    notes: string;

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn()
    created_at: Date;
}