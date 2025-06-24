import { Entity, PrimaryColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Product } from './product';
import { User } from './user';

@Entity('dealer_products')
export class DealerProduct {
    @PrimaryColumn('uuid')
    product_id: string;

    @PrimaryColumn('uuid')
    dealer_id: string;

    @ManyToOne(() => Product, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'product_id' })
    product: Product;

    @ManyToOne(() => User, { onDelete: 'CASCADE' })
    @JoinColumn({ name: 'dealer_id' })
    dealer: User;
}
