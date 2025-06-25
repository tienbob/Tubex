import { Repository } from 'typeorm';
import { Batch, Company, Warehouse, Inventory, Product, Payment, Order, Invoice } from '../../database/models/sql';

/**
 * Multi-Tenant Data Integrity Validation Service
 * 
 * This service provides validation functions to ensure data integrity
 * and multi-tenant isolation across all models after the critical fixes.
 */
export class DataIntegrityValidator {
    
    /**
     * Validates that a batch belongs to the specified company and warehouse
     */
    static async validateBatchOwnership(
        batchRepository: Repository<Batch>,
        batchId: string,
        companyId: string,
        warehouseId?: string
    ): Promise<boolean> {
        const batch = await batchRepository.findOne({
            where: { id: batchId },
            relations: ['company', 'warehouse']
        });

        if (!batch) {
            throw new Error('Batch not found');
        }

        // Validate company ownership
        if (batch.company_id !== companyId) {
            throw new Error('Batch does not belong to the specified company');
        }

        // Validate warehouse relationship if specified
        if (warehouseId && batch.warehouse_id !== warehouseId) {
            throw new Error('Batch does not belong to the specified warehouse');
        }

        // Validate warehouse belongs to same company
        if (batch.warehouse.company_id !== companyId) {
            throw new Error('Batch warehouse does not belong to the specified company');
        }

        return true;
    }

    /**
     * Validates that a payment belongs to the specified company
     */
    static async validatePaymentOwnership(
        paymentRepository: Repository<Payment>,
        paymentId: string,
        companyId: string
    ): Promise<boolean> {
        const payment = await paymentRepository.findOne({
            where: { id: paymentId },
            relations: ['company', 'order', 'invoice']
        });

        if (!payment) {
            throw new Error('Payment not found');
        }

        // Validate company ownership
        if (payment.companyId !== companyId) {
            throw new Error('Payment does not belong to the specified company');
        }

        // Validate order relationship if exists
        if (payment.order && payment.order.companyId !== companyId) {
            throw new Error('Payment order does not belong to the specified company');
        }

        return true;
    }

    /**
     * Validates product-warehouse-company relationships for inventory operations
     */
    static async validateInventoryRelationships(
        inventoryRepository: Repository<Inventory>,
        productRepository: Repository<Product>,
        warehouseRepository: Repository<Warehouse>,
        productId: string,
        warehouseId: string,
        companyId: string
    ): Promise<boolean> {
        // Get product details
        const product = await productRepository.findOne({
            where: { id: productId },
            relations: ['supplier', 'dealer']
        });

        if (!product) {
            throw new Error('Product not found');
        }

        // Get warehouse details
        const warehouse = await warehouseRepository.findOne({
            where: { id: warehouseId },
            relations: ['company']
        });

        if (!warehouse) {
            throw new Error('Warehouse not found');
        }

        // Validate warehouse belongs to company
        if (warehouse.company_id !== companyId) {
            throw new Error('Warehouse does not belong to the specified company');
        }

        // Validate product access rights
        const isSupplier = product.supplier_id === companyId;

        if (!isSupplier) {
            throw new Error('Company does not have access to this product');
        }

        return true;
    }

    /**
     * Validates batch quantity consistency with inventory
     */
    static async validateBatchInventoryConsistency(
        batchRepository: Repository<Batch>,
        inventoryRepository: Repository<Inventory>,
        productId: string,
        warehouseId: string,
        companyId: string
    ): Promise<{ isConsistent: boolean; discrepancy?: number }> {
        // Get all batches for the product in warehouse
        const batches = await batchRepository.find({
            where: {
                product_id: productId,
                warehouse_id: warehouseId,
                company_id: companyId,
                status: 'active'
            }
        });

        // Get inventory record
        const inventory = await inventoryRepository.findOne({
            where: {
                product_id: productId,
                warehouse_id: warehouseId,
                company_id: companyId
            }
        });

        if (!inventory) {
            return { isConsistent: batches.length === 0 };
        }

        // Calculate total batch quantity
        const totalBatchQuantity = batches.reduce((sum, batch) => sum + Number(batch.quantity), 0);
        const inventoryQuantity = Number(inventory.quantity);

        const discrepancy = Math.abs(totalBatchQuantity - inventoryQuantity);
        const isConsistent = discrepancy < 0.01; // Allow for minor decimal precision differences

        return {
            isConsistent,
            discrepancy: isConsistent ? undefined : discrepancy
        };
    }

    /**
     * Validates unique batch numbers per company
     */
    static async validateUniqueBatchNumber(
        batchRepository: Repository<Batch>,
        batchNumber: string,
        companyId: string,
        excludeBatchId?: string
    ): Promise<boolean> {
        const query: any = {
            batch_number: batchNumber,
            company_id: companyId
        };

        if (excludeBatchId) {
            query.id = { $ne: excludeBatchId };
        }

        const existingBatch = await batchRepository.findOne({ where: query });

        if (existingBatch) {
            throw new Error('Batch number already exists for this company');
        }

        return true;
    }

    /**
     * Comprehensive data integrity check for a company
     */
    static async runComprehensiveIntegrityCheck(repositories: {
        batch: Repository<Batch>;
        inventory: Repository<Inventory>;
        payment: Repository<Payment>;
        warehouse: Repository<Warehouse>;
        product: Repository<Product>;
        order: Repository<Order>;
        invoice: Repository<Invoice>;
    }, companyId: string): Promise<{
        isValid: boolean;
        errors: string[];
        warnings: string[];
    }> {
        const errors: string[] = [];
        const warnings: string[] = [];

        try {
            // Check for orphaned batches
            const orphanedBatches = await repositories.batch
                .createQueryBuilder('batch')
                .leftJoin('companies', 'c', 'batch.company_id = c.id')
                .where('batch.company_id = :companyId', { companyId })
                .andWhere('c.id IS NULL')
                .getMany();

            if (orphanedBatches.length > 0) {
                errors.push(`Found ${orphanedBatches.length} orphaned batch records`);
            }

            // Check for orphaned payments
            const orphanedPayments = await repositories.payment
                .createQueryBuilder('payment')
                .leftJoin('companies', 'c', 'payment.companyId = c.id')
                .where('payment.companyId = :companyId', { companyId })
                .andWhere('c.id IS NULL')
                .getMany();

            if (orphanedPayments.length > 0) {
                errors.push(`Found ${orphanedPayments.length} orphaned payment records`);
            }

            // Check inventory-warehouse company consistency
            const inconsistentInventory = await repositories.inventory
                .createQueryBuilder('inv')
                .leftJoin('warehouses', 'w', 'inv.warehouse_id = w.id')
                .where('inv.company_id = :companyId', { companyId })
                .andWhere('inv.company_id != w.company_id')
                .getMany();

            if (inconsistentInventory.length > 0) {
                errors.push(`Found ${inconsistentInventory.length} inventory records with inconsistent warehouse company`);
            }

            // Check for duplicate batch numbers per company
            const duplicateBatches = await repositories.batch
                .createQueryBuilder('b1')
                .innerJoin('batches', 'b2', 'b1.batch_number = b2.batch_number AND b1.company_id = b2.company_id AND b1.id != b2.id')
                .where('b1.company_id = :companyId', { companyId })
                .getMany();

            if (duplicateBatches.length > 0) {
                errors.push(`Found ${duplicateBatches.length} duplicate batch numbers`);
            }

            // Performance warnings
            const batchCount = await repositories.batch.count({ where: { company_id: companyId } });
            if (batchCount > 10000) {
                warnings.push(`High batch count (${batchCount}). Consider archiving old batches.`);
            }

            const paymentCount = await repositories.payment.count({ where: { companyId } });
            if (paymentCount > 5000) {
                warnings.push(`High payment count (${paymentCount}). Consider implementing data archival.`);
            }        } catch (error: any) {
            errors.push(`Integrity check failed: ${error?.message || 'Unknown error'}`);
        }

        return {
            isValid: errors.length === 0,
            errors,
            warnings
        };
    }
}

/**
 * Multi-tenant query helper to ensure all queries are properly filtered by company
 */
export class MultiTenantQueryHelper {
    
    /**
     * Creates a properly filtered query for batches
     */
    static createBatchQuery(repository: Repository<Batch>, companyId: string) {
        return repository.createQueryBuilder('batch')
            .where('batch.company_id = :companyId', { companyId });
    }

    /**
     * Creates a properly filtered query for payments
     */
    static createPaymentQuery(repository: Repository<Payment>, companyId: string) {
        return repository.createQueryBuilder('payment')
            .where('payment.companyId = :companyId', { companyId });
    }

    /**
     * Creates a properly filtered query for inventory
     */
    static createInventoryQuery(repository: Repository<Inventory>, companyId: string) {
        return repository.createQueryBuilder('inventory')
            .where('inventory.company_id = :companyId', { companyId });
    }

    /**
     * Creates a properly filtered query for warehouses
     */
    static createWarehouseQuery(repository: Repository<Warehouse>, companyId: string) {
        return repository.createQueryBuilder('warehouse')
            .where('warehouse.company_id = :companyId', { companyId });
    }
}
