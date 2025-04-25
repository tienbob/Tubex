import { DataSource } from 'typeorm';
import { config } from '../config';
import { User } from './models/sql';
import { Company } from './models/sql';
import { Product } from './models/sql';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: config.dbConfig.postgres.host,
  port: config.dbConfig.postgres.port,
  username: config.dbConfig.postgres.user,
  password: config.dbConfig.postgres.password,
  database: config.dbConfig.postgres.database,
  synchronize: false, // Disable in production
  logging: config.nodeEnv === 'development',
  entities: [User, Company, Product],
  migrations: ['src/database/migrations/*.ts'],
  subscribers: ['src/database/subscribers/*.ts']
});