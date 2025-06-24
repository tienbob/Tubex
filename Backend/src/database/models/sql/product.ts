import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Company } from './company';
import { ProductCategory } from './product-category';

@Entity('products')
export class Product {
    @PrimaryGeneratedColumn('uuid')
    id: string;    
    
    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;    
    @Column({ type: 'decimal', precision: 10, scale: 2, name: 'base_price' })
    base_price: number;    
    @Column()
    unit: string;

    // Product category relationship
    @Column({ name: 'category_id', nullable: true })
    category_id: string;

    @ManyToOne(() => ProductCategory, { nullable: true })
    @JoinColumn({ name: 'category_id' })
    category: ProductCategory;

    // Supplier is the company that provides/manufactures this product
    @Column({ name: 'supplier_id' })
    supplier_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'supplier_id' })
    supplier: Company;

    @Column()

    @Column("jsonb", { nullable: true })
    metadata: Record<string, any>;

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;

    @Column({ type: 'varchar', length: 32, default: 'active' })
    status: string;
}