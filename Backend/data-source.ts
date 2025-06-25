import * as dotenv from "dotenv";
dotenv.config();

import { DataSource } from "typeorm";
import { User } from "./src/database/models/sql/user";
import { Company } from "./src/database/models/sql/company";
import { Product } from "./src/database/models/sql/product";
import { Order, OrderItem } from "./src/database/models/sql/order";
import { OrderHistory } from "./src/database/models/sql/orderHistory";
import { Inventory } from "./src/database/models/sql/inventory";
import { Warehouse } from "./src/database/models/sql/warehouse";
import { Batch } from "./src/database/models/sql/batch";
import { Quote, QuoteItem } from "./src/database/models/sql/quote";
import { Invoice, InvoiceItem } from "./src/database/models/sql/invoice";
import { ProductPriceHistory } from "./src/database/models/sql/product-price-history";
import { Payment } from "./src/database/models/sql/payment";
import { ProductCategory } from "./src/database/models/sql/product-category";
import { Invitation } from "./src/database/models/sql/invitation"

// Load configuration directly from environment variables
const dbConfig = {
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  user: process.env.POSTGRES_USER || 'postgres',
  password: process.env.POSTGRES_PASSWORD || 'postgres',
  database: process.env.POSTGRES_DB || 'tubex_db'
};

const nodeEnv = process.env.NODE_ENV || 'development';

// Create and export a DataSource instance for TypeORM CLI
export default new DataSource({
  type: "postgres",
  host: dbConfig.host,
  port: dbConfig.port,
  username: dbConfig.user,
  password: dbConfig.password,
  database: dbConfig.database,
  synchronize: false,
  logging: nodeEnv === "development",
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
    ProductPriceHistory,
    Payment,
    ProductCategory,
    Invitation
  ],
  migrations: [
    "src/database/migrations/*.ts"
  ],
  subscribers: ["src/database/subscribers/*.ts"],
  migrationsTableName: "typeorm_migrations"
});
