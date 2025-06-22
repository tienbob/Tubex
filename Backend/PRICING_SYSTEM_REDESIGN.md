/**
 * UNIFIED PRICING SYSTEM DESIGN
 * 
 * This file documents the proposed consolidation of PriceList and ProductPriceHistory
 * into a unified, more efficient pricing system.
 */

/**
 * CURRENT PROBLEMS:
 * 1. PriceList and ProductPriceHistory serve overlapping purposes
 * 2. Data duplication between the two systems
 * 3. Complex queries to get current vs historical pricing
 * 4. Inconsistent pricing data across the application
 * 5. Difficulty maintaining pricing integrity
 */

/**
 * PROPOSED SOLUTION: Unified Product Pricing System
 * 
 * Replace both PriceList/PriceListItem and ProductPriceHistory with:
 * 1. ProductPricing (main pricing table)
 * 2. PricingHistory (audit trail)
 */

/* 
NEW TABLE STRUCTURE:

1. PRODUCT_PRICING (replaces both price_list_items and current pricing)
   - id (UUID, Primary Key)
   - product_id (UUID, Foreign Key to products)
   - company_id (UUID, Foreign Key to companies) 
   - pricing_type (ENUM: 'base', 'wholesale', 'retail', 'premium', 'dealer', 'bulk')
   - price (DECIMAL)
   - currency (VARCHAR, default 'USD')
   - min_quantity (INTEGER, for bulk pricing)
   - max_quantity (INTEGER, for bulk pricing) 
   - effective_from (DATE)
   - effective_to (DATE, nullable)
   - is_active (BOOLEAN, default true)
   - created_by_id (UUID)
   - metadata (JSONB, for custom pricing rules)
   - created_at (TIMESTAMP)
   - updated_at (TIMESTAMP)

2. PRICING_HISTORY (audit trail for all pricing changes)
   - id (UUID, Primary Key)
   - product_pricing_id (UUID, Foreign Key to product_pricing)
   - action (ENUM: 'created', 'updated', 'deleted', 'activated', 'deactivated')
   - old_values (JSONB, stores previous state)
   - new_values (JSONB, stores new state)
   - changed_by_id (UUID)
   - reason (TEXT)
   - changed_at (TIMESTAMP)

BENEFITS:
✅ Single source of truth for pricing
✅ Complete audit trail maintained
✅ Supports multiple pricing tiers per product
✅ Bulk/quantity-based pricing support
✅ Time-based pricing (effective dates)
✅ Better performance (fewer joins)
✅ Consistent API endpoints
✅ Easier to maintain and debug

MIGRATION STRATEGY:
1. Create new tables
2. Migrate existing PriceListItem data to ProductPricing
3. Migrate ProductPriceHistory data to PricingHistory
4. Update all controllers and services
5. Remove old tables after verification
*/
