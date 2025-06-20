import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn, OneToMany } from 'typeorm';
import { Company } from './company';

@Entity('product_categories')
export class ProductCategory {
    @PrimaryGeneratedColumn('uuid')
    id: string;
    
    @Column()
    name: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ name: 'company_id' })
    company_id: string;

    @ManyToOne(() => Company)
    @JoinColumn({ name: 'company_id' })
    company: Company;

    @Column({ name: 'parent_id', nullable: true })
    parent_id: string;

    @ManyToOne(() => ProductCategory, { nullable: true })
    @JoinColumn({ name: 'parent_id' })
    parent: ProductCategory;    @OneToMany(() => ProductCategory, category => category.parent)
    children: ProductCategory[];

    @CreateDateColumn({ name: 'created_at' })
    created_at: Date;

    @UpdateDateColumn({ name: 'updated_at' })
    updated_at: Date;
}
