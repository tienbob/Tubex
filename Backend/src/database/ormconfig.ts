import { DataSource } from 'typeorm';
import { config } from '../config';
import { User } from './models/sql/user';
import { Company } from './models/sql/company';
import { Product } from './models/sql/product';
import { Order, OrderItem } from './models/sql/order';
import { OrderHistory } from './models/sql/orderHistory';
import { Inventory } from './models/sql/inventory';
import { Warehouse } from './models/sql/warehouse';
import { Batch } from './models/sql/batch';
import { Quote, QuoteItem } from './models/sql/quote';
import { Invoice, InvoiceItem } from './models/sql/invoice';
import { PriceList } from './models/sql/price-list';
import { PriceListItem } from './models/sql/price-list-item';
import { ProductPriceHistory } from './models/sql/product-price-history';
import { Payment } from './models/sql/payment';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.dbConfig.postgres.host,
  port: config.dbConfig.postgres.port,
    username: config.dbConfig.postgres.user,
    password: config.dbConfig.postgres.password,
  database: config.dbConfig.postgres.database,
  synchronize: false, // Disable in production
  logging: config.nodeEnv === 'development',  
  // Explicitly list all entities to ensure proper registration
  entities: [
    User, 
    Company, 
    Product, 
    Order, 
    OrderItem, 
    OrderHistory, 
    Inventory, 
    Warehouse, 
    Batch,
    Quote,
    QuoteItem,
    Invoice,
    InvoiceItem,
    PriceList,
    PriceListItem,
    ProductPriceHistory,
    Payment
  ],  
  migrations: [
    // New organized migrations (one file per table)
    'src/database/migrations/1684000000000-CreateCompanyTable.ts',
    'src/database/migrations/1684000001000-CreateUserTable.ts',
    'src/database/migrations/1684000002000-CreateProductTable.ts',
    'src/database/migrations/1684000003000-CreateWarehouseTable.ts',
    'src/database/migrations/1684000004000-CreateBatchTable.ts',
    'src/database/migrations/1684000005000-CreateInventoryTable.ts',
    'src/database/migrations/1684000006000-CreateOrderTable.ts',
    'src/database/migrations/1684000007000-CreateOrderItemTable.ts',
    'src/database/migrations/1715652854000-EnsureCompanyIdField.ts',
    'src/database/migrations/1684000008000-CreateOrderHistoryTable.ts',    
    'src/database/migrations/1684000009000-CreateUserAuditLogTable.ts',
    'src/database/migrations/1715862288000-CreateQuoteTable.ts',
    'src/database/migrations/1715862490000-CreatePriceListTables.ts',
    'src/database/migrations/1715862389000-CreateInvoiceTable.ts',
    'src/database/migrations/1715862389001-CreateInvoiceItemTable.ts',
    'src/database/migrations/1715862389002-CreateQuoteItemTable.ts',
    'src/database/migrations/1742098765432-CreatePaymentTable.ts'
    
    // Keep old migrations for reference but comment them out
    /* 
    'src/database/migrations/1682400000000-InitialSchema.ts',
    'src/database/migrations/1682400001000-CreateInventoryTable.ts',
    'src/database/migrations/1682400002000-AddWarehouseAndBatchTables.ts',
    'src/database/migrations/1682400003000-AddOrderTables.ts',
    'src/database/migrations/1682400005000-AddOrderHistory.ts',
    'src/database/migrations/1683234000000-AddUserAuditLogs.ts',
    'src/database/migrations/1683234001000-AddCompanyVerificationFields.ts',
    'src/database/migrations/1683400000000-EnhanceWarehouseTable.ts',
    'src/database/migrations/1683500000000-AddUserMetadataColumn.ts',
    'src/database/migrations/1683500001000-AddCompanyMetadataColumn.ts',
    'src/database/migrations/1683500002000-AddProductMetadataColumn.ts'
    */
  ],
  subscribers: ['src/database/subscribers/*.ts']
});