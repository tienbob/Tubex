import { AppDataSource } from '../database';
import { PriceList } from '../database/models/sql/price-list';
import { PriceListItem } from '../database/models/sql/price-list-item';
import { ProductPriceHistory } from '../database/models/sql/product-price-history';
import { ProductPricing, PricingType } from '../database/models/sql/product-pricing';
import { PricingHistory, PricingAction } from '../database/models/sql/pricing-history';
import { logger } from '../app';

/**
 * Migration service to transition from the dual pricing system 
 * (PriceList + ProductPriceHistory) to the unified ProductPricing system
 */
export class PricingMigrationService {
    
    /**
     * Migrate data from old pricing system to new unified system
     */
    async migrateToUnifiedPricing(): Promise<void> {
        logger.info('🚀 Starting pricing system migration...');
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Step 1: Migrate PriceListItems to ProductPricing
            await this.migratePriceListItems(queryRunner);
            
            // Step 2: Migrate ProductPriceHistory to PricingHistory
            await this.migrateProductPriceHistory(queryRunner);
            
            // Step 3: Verify migration integrity
            await this.verifyMigration(queryRunner);
            
            await queryRunner.commitTransaction();
            logger.info('✅ Pricing system migration completed successfully');
            
        } catch (error) {
            await queryRunner.rollbackTransaction();
            logger.error('❌ Pricing system migration failed:', error);
            throw error;
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Migrate PriceListItems to ProductPricing entries
     */
    private async migratePriceListItems(queryRunner: any): Promise<void> {
        logger.info('📊 Migrating PriceListItems to ProductPricing...');
        
        const priceListItems = await queryRunner.manager.find(PriceListItem, {
            relations: ['price_list', 'product']
        });

        for (const item of priceListItems) {
            const pricingType = this.determinePricingType(item.price_list.name);
            
            const productPricing = new ProductPricing();
            productPricing.product_id = item.product_id;
            productPricing.company_id = item.price_list.company_id;
            productPricing.pricing_type = pricingType;
            productPricing.price = item.price;
            productPricing.discount_percentage = item.discount_percentage || 0;
            productPricing.effective_from = item.effective_from;
            productPricing.effective_to = item.effective_to;
            productPricing.is_active = item.price_list.status === 'active';
            productPricing.created_by_id = 'migration-system'; // TODO: Map to actual user if available
            productPricing.metadata = {
                migrated_from: 'price_list_item',
                original_price_list_id: item.price_list_id,
                original_item_id: item.id,
                original_price_list_name: item.price_list.name,
                migration_date: new Date()
            };

            await queryRunner.manager.save(productPricing);
            
            // Create migration history entry
            const history = new PricingHistory();
            history.product_pricing_id = productPricing.id;
            history.action = PricingAction.CREATED;
            history.new_values = {
                pricing_type: pricingType,
                price: item.price,
                discount_percentage: item.discount_percentage
            };
            history.changed_by_id = 'migration-system';
            history.reason = `Migrated from price list: ${item.price_list.name}`;
            history.metadata = {
                migration_source: 'price_list_item',
                original_item_id: item.id
            };

            await queryRunner.manager.save(history);
        }
        
        logger.info(`✅ Migrated ${priceListItems.length} price list items`);
    }

    /**
     * Migrate ProductPriceHistory to PricingHistory
     */
    private async migrateProductPriceHistory(queryRunner: any): Promise<void> {
        logger.info('📈 Migrating ProductPriceHistory to PricingHistory...');
        
        const priceHistories = await queryRunner.manager.find(ProductPriceHistory);

        for (const oldHistory of priceHistories) {
            const history = new PricingHistory();
            history.product_pricing_id = null; // Historical record, may not map to current pricing
            history.action = PricingAction.UPDATED;
            history.old_values = {
                price: oldHistory.old_price
            };
            history.new_values = {
                price: oldHistory.new_price
            };
            history.changed_by_id = oldHistory.changed_by_id;
            history.reason = oldHistory.reason;
            history.changed_at = oldHistory.created_at;
            history.metadata = {
                migrated_from: 'product_price_history',
                original_id: oldHistory.id,
                product_id: oldHistory.product_id,
                migration_date: new Date()
            };

            await queryRunner.manager.save(history);
        }
        
        logger.info(`✅ Migrated ${priceHistories.length} price history records`);
    }

    /**
     * Verify migration integrity
     */
    private async verifyMigration(queryRunner: any): Promise<void> {
        logger.info('🔍 Verifying migration integrity...');
        
        const priceListItemCount = await queryRunner.manager.count(PriceListItem);
        const productPricingCount = await queryRunner.manager.count(ProductPricing, {
            where: { metadata: { migrated_from: 'price_list_item' } }
        });
        
        if (priceListItemCount !== productPricingCount) {
            throw new Error(`Migration count mismatch: ${priceListItemCount} PriceListItems vs ${productPricingCount} ProductPricing records`);
        }
        
        logger.info('✅ Migration integrity verified');
    }

    /**
     * Determine pricing type based on price list name
     */
    private determinePricingType(priceListName: string): PricingType {
        const name = priceListName.toLowerCase();
        
        if (name.includes('wholesale')) return PricingType.WHOLESALE;
        if (name.includes('retail')) return PricingType.RETAIL;
        if (name.includes('premium')) return PricingType.PREMIUM;
        if (name.includes('dealer')) return PricingType.DEALER;
        if (name.includes('bulk')) return PricingType.BULK;
        if (name.includes('promo')) return PricingType.PROMOTIONAL;
        
        return PricingType.BASE; // Default fallback
    }

    /**
     * Create backup of old tables before migration
     */
    async createBackupTables(): Promise<void> {
        logger.info('💾 Creating backup tables...');
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();

        try {
            // Create backup tables with timestamp
            const timestamp = new Date().toISOString().replace(/[:.]/g, '_');
            
            await queryRunner.query(`
                CREATE TABLE price_lists_backup_${timestamp} AS 
                SELECT * FROM price_lists
            `);
            
            await queryRunner.query(`
                CREATE TABLE price_list_items_backup_${timestamp} AS 
                SELECT * FROM price_list_items  
            `);
            
            await queryRunner.query(`
                CREATE TABLE product_price_history_backup_${timestamp} AS 
                SELECT * FROM product_price_history
            `);
            
            logger.info('✅ Backup tables created successfully');
            
        } finally {
            await queryRunner.release();
        }
    }

    /**
     * Rollback migration if needed
     */
    async rollbackMigration(): Promise<void> {
        logger.info('🔄 Rolling back pricing migration...');
        
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Delete migrated records
            await queryRunner.manager.delete(PricingHistory, {
                metadata: { migrated_from: 'price_list_item' }
            });
            
            await queryRunner.manager.delete(PricingHistory, {
                metadata: { migrated_from: 'product_price_history' }
            });
            
            await queryRunner.manager.delete(ProductPricing, {
                metadata: { migrated_from: 'price_list_item' }
            });
            
            await queryRunner.commitTransaction();
            logger.info('✅ Migration rollback completed');
            
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    }
}
