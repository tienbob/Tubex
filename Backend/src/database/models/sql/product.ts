import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;    
    
    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_price' })
    base_price: number;

    @Column()
    unit: string;

    // Supplier is the company that provides/manufactures this product
    @Column({ name: 'supplier_id' })
    supplier_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'supplier_id' })
    supplier: Company;

    // Dealer is optional - only set when a dealer has exclusive rights to this product
    // Most products will have null dealer_id (available to all dealers)
    @Column({ name: 'dealer_id', nullable: true })
    dealer_id: string;

    @ManyToOne(() => Company, { nullable: true })
    @JoinColumn({ name: 'dealer_id' })
    dealer: Company;@Column({ default: 'active' })
    status: string;

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}