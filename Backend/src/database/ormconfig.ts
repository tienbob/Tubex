import { DataSource } from 'typeorm';
import { config } from '../config';
import { User } from './models/sql/user';
import { Company } from './models/sql/company';
import { Product } from './models/sql/product';
import { Order } from './models/sql/order';
import { OrderItem } from './models/sql/order';
import { OrderHistory } from './models/sql/orderHistory';
import { Inventory } from './models/sql/inventory';
import { Warehouse } from './models/sql/warehouse';
import { Batch } from './models/sql/batch';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.dbConfig.postgres.host,
  port: config.dbConfig.postgres.port,
  username: config.dbConfig.postgres.user,
  password: config.dbConfig.postgres.password,
  database: config.dbConfig.postgres.database,
  synchronize: false, // Disable in production
  logging: config.nodeEnv === 'development',
  entities: [User, Company, Product, Order, OrderItem, OrderHistory, Inventory, Warehouse, Batch],
  migrations: [
    'src/database/migrations/1682400000000-InitialSchema.ts',
    'src/database/migrations/1682400001000-CreateInventoryTable.ts',
    'src/database/migrations/1682400002000-AddWarehouseAndBatchTables.ts',
    'src/database/migrations/1682400003000-AddOrderTables.ts',
    'src/database/migrations/1682400004000-UpdateCompanyInfo.ts',
    'src/database/migrations/1682400005000-AddOrderHistory.ts'
  ],
  subscribers: ['src/database/subscribers/*.ts']
});