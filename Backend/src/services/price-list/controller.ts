import { Request, Response } from 'express';
import { AppDataSource } from '../../database';
import { PriceList, PriceListStatus } from '../../database/models/sql/price-list';
import { PriceListItem } from '../../database/models/sql/price-list-item';
import { ProductPriceHistory } from '../../database/models/sql/product-price-history';
import { Product } from '../../database/models/sql/product';
import { AppError } from '../../middleware/errorHandler';
import { In } from 'typeorm';
import { parse } from 'csv-parse/sync';
import { logger } from '../../app';

// Extended types
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
        companyId: string; // Note: auth middleware uses companyId, not company_id
        companyType?: string; // Making it optional to accommodate undefined, but not null
    };
}

export const priceListController = {    
    async getAllPriceLists(req: AuthenticatedRequest, res: Response) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const status = req.query.status as string;
        const search = req.query.search as string;

        const companyId = req.user.companyId;
        const skip = (page - 1) * limit;

        const queryBuilder = AppDataSource.getRepository(PriceList)
            .createQueryBuilder('priceList')
            .where('priceList.company_id = :companyId', { companyId })
            .orderBy('priceList.updated_at', 'DESC')
            .skip(skip)
            .take(limit);

        // Apply filters
        if (status) {
            queryBuilder.andWhere('priceList.status = :status', { status });
        }

        if (search) {
            queryBuilder.andWhere('priceList.name ILIKE :search', { search: `%${search}%` });
        }

        const [priceLists, total] = await queryBuilder.getManyAndCount();

        res.status(200).json({
            success: true,
            data: priceLists,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    },    async getPriceListById(req: AuthenticatedRequest, res: Response) {
        const { id } = req.params;
        const companyId = req.user.companyId;

        const priceList = await AppDataSource.getRepository(PriceList).findOne({
            where: { id, company_id: companyId }
        });

        if (!priceList) {
            throw new AppError(404, 'Price list not found');
        }

        res.status(200).json({
            success: true,
            data: priceList
        });
    },    async createPriceList(req: AuthenticatedRequest, res: Response) {
        const {
            name,
            description,
            status = PriceListStatus.DRAFT,
            effective_from,
            effective_to,
            is_default = false,
            global_discount_percentage = 0,
            metadata
        } = req.body;

        const companyId = req.user.companyId;

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // If this is being set as default, unset any other default price lists
            if (is_default) {
                await queryRunner.manager.update(
                    PriceList,
                    { company_id: companyId, is_default: true },
                    { is_default: false }
                );
            }

            // Create new price list
            const priceList = new PriceList();
            priceList.name = name;
            priceList.description = description;
            priceList.company_id = companyId;
            priceList.status = status;
            priceList.effective_from = new Date(effective_from) ;
            priceList.effective_to =  new Date(effective_to);
            priceList.is_default = is_default;
            priceList.global_discount_percentage = global_discount_percentage;
            priceList.metadata = metadata || {};

            await queryRunner.manager.save(priceList);
            await queryRunner.commitTransaction();

            res.status(201).json({
                success: true,
                data: priceList
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },    async updatePriceList(req: AuthenticatedRequest, res: Response) {

        const { id } = req.params;
        const companyId = req.user.companyId;
        const {
            name,
            description,
            status,
            effective_from,
            effective_to,
            is_default,
            global_discount_percentage,
            metadata
        } = req.body;

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if price list exists and belongs to the company
            const priceList = await queryRunner.manager.findOne(PriceList, {
                where: { id, company_id: companyId }
            });

            if (!priceList) {
                throw new AppError(404, 'Price list not found');
            }

            // If this is being set as default, unset any other default price lists
            if (is_default && !priceList.is_default) {
                await queryRunner.manager.update(
                    PriceList,
                    { company_id: companyId, is_default: true },
                    { is_default: false }
                );
            }

            // Update fields if provided
            if (name !== undefined) priceList.name = name;
            if (description !== undefined) priceList.description = description;
            if (status !== undefined) priceList.status = status;
            if (effective_from !== undefined) {
                priceList.effective_from = new Date(effective_from);
            }
            if (effective_to !== undefined) {
                priceList.effective_to = new Date(effective_to);
            }
            if (is_default !== undefined) priceList.is_default = is_default;
            if (global_discount_percentage !== undefined) {
                priceList.global_discount_percentage = global_discount_percentage;
            }
            if (metadata !== undefined) {
                priceList.metadata = { ...priceList.metadata, ...metadata };
            }

            await queryRunner.manager.save(priceList);
            await queryRunner.commitTransaction();

            res.status(200).json({
                success: true,
                data: priceList
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async deletePriceList(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;
        const companyId = req.user.companyId;

        // Check if price list exists and belongs to the company
        const priceList = await AppDataSource.getRepository(PriceList).findOne({
            where: { id, company_id: companyId }
        });

        if (!priceList) {
            throw new AppError(404, 'Price list not found');
        }

        // Delete price list (cascade will remove items)
        await AppDataSource.getRepository(PriceList).remove(priceList);

        res.status(200).json({
            success: true,
            message: 'Price list deleted successfully'
        });
    },

    async getPriceListItems(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const search = req.query.search as string;
        const companyId = req.user.companyId;

        // Check if price list exists and belongs to the company
        const priceList = await AppDataSource.getRepository(PriceList).findOne({
            where: { id, company_id: companyId }
        });

        if (!priceList) {
            throw new AppError(404, 'Price list not found');
        }

        const skip = (page - 1) * limit;

        // Query price list items with product information
        const queryBuilder = AppDataSource.getRepository(PriceListItem)
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.product', 'product')
            .where('item.price_list_id = :priceListId', { priceListId: id })
            .orderBy('product.name', 'ASC')
            .skip(skip)
            .take(limit);        // Apply search filter if provided
        if (search) {
            queryBuilder.andWhere('product.name ILIKE :search', {
                search: `%${search}%`
            });
        }

        const [items, total] = await queryBuilder.getManyAndCount();

        res.status(200).json({
            success: true,
            data: items,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    },

    async addPriceListItem(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id: priceListId } = req.params;
        const companyId = req.user.companyId;
        const {
            product_id,
            price,
            discount_percentage = 0,
            effective_from,
            effective_to,
            metadata
        } = req.body;

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if price list exists and belongs to the company
            const priceList = await queryRunner.manager.findOne(PriceList, {
                where: { id: priceListId, company_id: companyId }
            });

            if (!priceList) {
                throw new AppError(404, 'Price list not found');
            }

            // Check if product exists
            const product = await queryRunner.manager.findOne(Product, {
                where: { id: product_id }
            });

            if (!product) {
                throw new AppError(404, 'Product not found');
            }

            // Check if item already exists in this price list
            const existingItem = await queryRunner.manager.findOne(PriceListItem, {
                where: { price_list_id: priceListId, product_id }
            });

            if (existingItem) {
                throw new AppError(409, 'This product already exists in the price list');
            }

            // Create new price list item
            const priceListItem = new PriceListItem();
            priceListItem.price_list_id = priceListId;
            priceListItem.product_id = product_id;
            priceListItem.price = price;
            priceListItem.discount_percentage = discount_percentage;
            if (effective_from) priceListItem.effective_from = new Date(effective_from);
            if (effective_to) priceListItem.effective_to = new Date(effective_to);
            priceListItem.metadata = metadata || {};

            await queryRunner.manager.save(priceListItem);

            // Record price history
            const priceHistory = new ProductPriceHistory();
            priceHistory.product_id = product_id;
            priceHistory.reason = `Added to price list: ${priceList.name}`;
            priceHistory.old_price = product.base_price;
            priceHistory.new_price = price;
            priceHistory.changed_by_id = req.user.id;
            priceHistory.metadata = {
                action: 'added_to_price_list',
                price_list_name: priceList.name
            };

            await queryRunner.manager.save(priceHistory);
            await queryRunner.commitTransaction();

            res.status(201).json({
                success: true,
                data: priceListItem
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async updatePriceListItem(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id: priceListId, itemId } = req.params;
        const companyId = req.user.companyId;
        const {
            price,
            discount_percentage,
            effective_from,
            effective_to,
            metadata
        } = req.body;

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if price list exists and belongs to the company
            const priceList = await queryRunner.manager.findOne(PriceList, {
                where: { id: priceListId, company_id: companyId }
            });

            if (!priceList) {
                throw new AppError(404, 'Price list not found');
            }

            // Check if price list item exists
            const priceListItem = await queryRunner.manager.findOne(PriceListItem, {
                where: { id: itemId, price_list_id: priceListId }
            });

            if (!priceListItem) {
                throw new AppError(404, 'Price list item not found');
            }

            const oldPrice = priceListItem.price;

            // Update fields if provided
            if (price !== undefined) priceListItem.price = price;
            if (discount_percentage !== undefined) priceListItem.discount_percentage = discount_percentage;
            if (effective_from !== undefined) {
                priceListItem.effective_from =  new Date(effective_from) ;
            }
            if (effective_to !== undefined) {
                priceListItem.effective_to =new Date(effective_to) ;
            }
            if (metadata !== undefined) {
                priceListItem.metadata = { ...priceListItem.metadata, ...metadata };
            }

            await queryRunner.manager.save(priceListItem);

            // If price changed, record price history
            if (price !== undefined && price !== oldPrice) {
                const priceHistory = new ProductPriceHistory();
                priceHistory.product_id = priceListItem.product_id;
                priceHistory.reason = `Updated in price list: ${priceList.name}`;
                priceHistory.old_price = oldPrice;
                priceHistory.new_price = price;
                priceHistory.changed_by_id = req.user.id;
                priceHistory.metadata = {
                    action: 'updated_in_price_list',
                    price_list_name: priceList.name
                };

                await queryRunner.manager.save(priceHistory);
            }

            await queryRunner.commitTransaction();

            res.status(200).json({
                success: true,
                data: priceListItem
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async deletePriceListItem(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id: priceListId, itemId } = req.params;
        const companyId = req.user.companyId;

        // Check if price list exists and belongs to the company
        const priceList = await AppDataSource.getRepository(PriceList).findOne({
            where: { id: priceListId, company_id: companyId }
        });

        if (!priceList) {
            throw new AppError(404, 'Price list not found');
        }

        // Check if price list item exists
        const priceListItem = await AppDataSource.getRepository(PriceListItem).findOne({
            where: { id: itemId, price_list_id: priceListId }
        });

        if (!priceListItem) {
            throw new AppError(404, 'Price list item not found');
        }

        // Delete price list item
        await AppDataSource.getRepository(PriceListItem).remove(priceListItem);

        res.status(200).json({
            success: true,
            message: 'Price list item deleted successfully'
        });
    },

    async bulkAddItems(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id: priceListId } = req.params;
        const companyId = req.user.companyId;
        const { items } = req.body;

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if price list exists and belongs to the company
            const priceList = await queryRunner.manager.findOne(PriceList, {
                where: { id: priceListId, company_id: companyId }
            });

            if (!priceList) {
                throw new AppError(404, 'Price list not found');
            }

            // Extract product IDs for validation
            const productIds = items.map((item: any) => item.product_id);

            // Check if products exist
            const products = await queryRunner.manager.find(Product, {
                where: { id: In(productIds) }
            });

            if (products.length !== productIds.length) {
                throw new AppError(400, 'One or more products not found');
            }

            // Check for existing items
            const existingItems = await queryRunner.manager.find(PriceListItem, {
                where: { price_list_id: priceListId, product_id: In(productIds) }
            });

            if (existingItems.length > 0) {
                const existingProductIds = existingItems.map((item) => item.product_id);
                throw new AppError(409, `Products already in price list: ${existingProductIds.join(', ')}`);
            }

            // Create price list items
            const priceListItems = items.map((item: any) => {
                const priceListItem = new PriceListItem();
                priceListItem.price_list_id = priceListId;
                priceListItem.product_id = item.product_id;
                priceListItem.price = item.price;
                priceListItem.discount_percentage = item.discount_percentage || 0;
                if (item.effective_from) priceListItem.effective_from = new Date(item.effective_from);
                if (item.effective_to) priceListItem.effective_to = new Date(item.effective_to);
                priceListItem.metadata = item.metadata || {};
                return priceListItem;
            });

            const savedItems = await queryRunner.manager.save(PriceListItem, priceListItems);
            // Record price history for each item
            const priceHistories = items.map((item: any) => {
                const product = products.find(p => p.id === item.product_id);
                const priceHistory = new ProductPriceHistory();
                priceHistory.product_id = item.product_id;
                priceHistory.reason = `Bulk added to price list: ${priceList.name}`;
                priceHistory.old_price = product?.base_price || 0;
                priceHistory.new_price = item.price;
                priceHistory.changed_by_id = req.user?.id || '';
                priceHistory.metadata = {
                    action: 'bulk_added_to_price_list',
                    price_list_name: priceList.name
                };
                return priceHistory;
            });

            await queryRunner.manager.save(ProductPriceHistory, priceHistories);
            await queryRunner.commitTransaction();

            res.status(201).json({
                success: true,
                data: savedItems,
                message: `${savedItems.length} items added to price list`
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async bulkUpdateItems(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id: priceListId } = req.params;
        const companyId = req.user.companyId;
        const { items } = req.body;

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Check if price list exists and belongs to the company
            const priceList = await queryRunner.manager.findOne(PriceList, {
                where: { id: priceListId, company_id: companyId }
            });

            if (!priceList) {
                throw new AppError(404, 'Price list not found');
            }

            // Extract item IDs for validation
            const itemIds = items.map((item: any) => item.id);

            // Check if items exist
            const existingItems = await queryRunner.manager.find(PriceListItem, {
                where: { id: In(itemIds), price_list_id: priceListId }
            });

            if (existingItems.length !== itemIds.length) {
                throw new AppError(400, 'One or more items not found in this price list');
            }

            // Update items and create price histories
            const priceHistories = [];

            for (const item of items) {
                const existingItem = existingItems.find(i => i.id === item.id);
                if (!existingItem) continue;

                const oldPrice = existingItem.price;

                // Update fields if provided
                if (item.price !== undefined) existingItem.price = item.price;
                if (item.discount_percentage !== undefined) existingItem.discount_percentage = item.discount_percentage;
                if (item.effective_from !== undefined) {
                    existingItem.effective_from = new Date(item.effective_from);
                }
                if (item.effective_to !== undefined) {
                    existingItem.effective_to = new Date(item.effective_to);
                }
                if (item.metadata !== undefined) {
                    existingItem.metadata = { ...existingItem.metadata, ...item.metadata };
                }

                await queryRunner.manager.save(existingItem);
                // If price changed, record price history
                if (item.price !== undefined && item.price !== oldPrice) {
                    const priceHistory = new ProductPriceHistory();
                    priceHistory.product_id = existingItem.product_id;
                    priceHistory.reason = `Bulk updated in price list: ${priceList.name}`;
                    priceHistory.old_price = oldPrice;
                    priceHistory.new_price = item.price;
                    priceHistory.changed_by_id = req.user.id;
                    priceHistory.metadata = {
                        action: 'bulk_updated_in_price_list',
                        price_list_name: priceList.name
                    };
                    priceHistories.push(priceHistory);
                }
            }

            // Save price histories if any
            if (priceHistories.length > 0) {
                await queryRunner.manager.save(ProductPriceHistory, priceHistories);
            }

            await queryRunner.commitTransaction();

            res.status(200).json({
                success: true,
                message: `${items.length} items updated in price list`
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },

    async exportPriceList(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { id: priceListId } = req.params;
        const companyId = req.user.companyId;
        const format = (req.query.format as string) || 'csv';

        // Check if price list exists and belongs to the company
        const priceList = await AppDataSource.getRepository(PriceList).findOne({
            where: { id: priceListId, company_id: companyId }
        });

        if (!priceList) {
            throw new AppError(404, 'Price list not found');
        }

        // Get all price list items with product information
        const priceListItems = await AppDataSource.getRepository(PriceListItem)
            .createQueryBuilder('item')
            .leftJoinAndSelect('item.product', 'product')
            .where('item.price_list_id = :priceListId', { priceListId })
            .getMany();

        if (format === 'json') {
            return res.status(200).json({
                success: true,
                data: {
                    priceList,
                    items: priceListItems
                }
            });
        } else if (format === 'csv') {            // Format data for CSV
            const csvData = [
                ['Product ID', 'Name', 'Price', 'Discount %', 'Effective From', 'Effective To']
            ];

            priceListItems.forEach(item => {
                csvData.push([
                    item.product_id,
                    item.product?.name || '',
                    item.price.toString(),
                    item.discount_percentage.toString(),
                    item.effective_from ? item.effective_from.toISOString().split('T')[0] : '',
                    item.effective_to ? item.effective_to.toISOString().split('T')[0] : ''
                ]);
            });

            // Convert to CSV string
            const csvString = csvData.map(row => row.join(',')).join('\n');

            // Set headers for file download
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="price-list-${priceListId}.csv"`);
            
            return res.status(200).send(csvString);
        } else {
            throw new AppError(400, 'Unsupported export format. Use "csv" or "json"');
        }
    },    async importPriceList(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const companyId = req.user.companyId;
        const { name, status, effective_from, effective_to, items } = req.body;
        
        // Extract product IDs for product lookup
        const productIds = items.map((item: any) => item.product_id);

        // Start a transaction
        const queryRunner = AppDataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Look up products by ID
            const products = await queryRunner.manager.find(Product, {
                where: { id: In(productIds) }
            });

            if (products.length === 0) {
                throw new AppError(400, 'No matching products found by ID');
            }

            // Create new price list
            const priceList = new PriceList();
            priceList.name = name;
            priceList.description = `Imported price list with ${products.length} products`;
            priceList.company_id = companyId;
            priceList.status = status || PriceListStatus.DRAFT;
            priceList.effective_from = new Date(effective_from);
            priceList.effective_to = new Date(effective_to);
            priceList.is_default = false;
            priceList.global_discount_percentage = 0;
            priceList.metadata = { 
                imported_at: new Date(),
                imported_by: req.user.id,
                source: 'csv_import'
            };

            await queryRunner.manager.save(priceList);            // Create price list items for matching products
            const priceListItems = [];
            const priceHistories = [];
            const productsNotFound = [];

            for (const item of items) {
                const product = products.find(p => p.id === item.product_id);
                if (!product) {
                    productsNotFound.push(item.product_id);
                    continue;
                }

                const priceListItem = new PriceListItem();
                priceListItem.price_list_id = priceList.id;
                priceListItem.product_id = product.id;
                priceListItem.price = item.price;
                priceListItem.discount_percentage = item.discount_percentage || 0;
                if (effective_from) priceListItem.effective_from = new Date(effective_from);
                if (effective_to) priceListItem.effective_to = new Date(effective_to);
                priceListItems.push(priceListItem);
                // Create price history record
                const priceHistory = new ProductPriceHistory();
                priceHistory.product_id = product.id;
                priceHistory.reason = `Imported to price list: ${priceList.name}`;
                priceHistory.old_price = product.base_price;
                priceHistory.new_price = item.price;
                priceHistory.changed_by_id = req.user.id;
                priceHistory.metadata = {
                    action: 'imported_to_price_list',
                    price_list_name: priceList.name
                };
                priceHistories.push(priceHistory);
            }

            if (priceListItems.length === 0) {
                throw new AppError(400, 'No valid products found for import');
            }            await queryRunner.manager.save(PriceListItem, priceListItems);
            await queryRunner.manager.save(ProductPriceHistory, priceHistories);
            await queryRunner.commitTransaction();

            res.status(201).json({
                success: true,
                data: {
                    priceList,
                    itemsImported: priceListItems.length,
                    productsNotFound: productsNotFound
                },
                message: `Price list imported with ${priceListItems.length} items`
            });
        } catch (error) {
            await queryRunner.rollbackTransaction();
            throw error;
        } finally {
            await queryRunner.release();
        }
    },    async uploadCsvPriceList(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');
        if (!req.file) throw new AppError(400, 'No CSV file uploaded');
        
        const companyId = req.user.companyId;
        const { name, status } = req.body;

        try {
            // Parse CSV file
            const fileContent = req.file.buffer.toString('utf8');
            const records = parse(fileContent, {
                columns: true,
                skip_empty_lines: true
            });

            if (!records || records.length === 0) {
                throw new AppError(400, 'CSV file is empty or invalid');
            }            // Transform CSV records into expected format
            const items = records.map((record: any) => ({
                product_id: record.id || record.ID || record.product_id || record['Product ID'],
                price: parseFloat(record.price || record.Price || record.amount || record.Amount || 0),
                discount_percentage: parseFloat(record.discount || record.Discount || record.discount_percentage || 0)
            }));

            // Call import price list function directly with parsed data
            req.body = {
                name: name || `Imported Price List ${new Date().toISOString().split('T')[0]}`,
                status: status || PriceListStatus.DRAFT,
                items
            };

            // Instead of using this.importPriceList, call the function directly
            return priceListController.importPriceList(req, res);
        } catch (error) {
            if (error instanceof Error) {
                logger.error(`CSV import error: ${error.message}`);
                throw new AppError(400, `Error parsing CSV: ${error.message}`);
            }
            throw error;
        }
    },

    async getProductPriceHistory(req: Request, res: Response) {
        if (!req.user) throw new AppError(401, 'Authentication required');

        const { productId } = req.params;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        // Check if product exists
        const product = await AppDataSource.getRepository(Product).findOne({
            where: { id: productId }
        });        if (!product) {
            throw new AppError(404, 'Product not found');
        }

        // Get price history for product
        const queryBuilder = AppDataSource.getRepository(ProductPriceHistory)
            .createQueryBuilder('history')
            .where('history.product_id = :productId', { productId })
            .orderBy('history.created_at', 'DESC')
            .skip(skip)
            .take(limit);

        const [histories, total] = await queryBuilder.getManyAndCount();

        res.status(200).json({
            success: true,
            data: histories,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    }
};
