const { DataSource } = require('typeorm');

// Database configuration
const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',    password: process.env.DB_PASSWORD || 'development',
    database: process.env.DB_NAME || 'tubex',
    entities: [],
    synchronize: false,
    logging: true
});

async function checkDatabaseData() {
    try {
        await dataSource.initialize();
        console.log('Connected to database');

        // Check companies
        const companies = await dataSource.query('SELECT id, name, type FROM companies LIMIT 5');
        console.log('\n=== COMPANIES ===');
        console.log(companies);

        if (companies.length > 0) {
            const companyId = companies[0].id;
            console.log(`\nUsing company ID: ${companyId}`);

            // Check warehouses
            const warehouses = await dataSource.query(
                'SELECT id, name, company_id FROM warehouses WHERE company_id = $1 LIMIT 5',
                [companyId]
            );
            console.log('\n=== WAREHOUSES ===');
            console.log(warehouses);

            // Check products
            const products = await dataSource.query(
                'SELECT id, name, supplier_id, dealer_id FROM products WHERE supplier_id = $1 OR dealer_id = $1 LIMIT 5',
                [companyId]
            );
            console.log('\n=== PRODUCTS ===');
            console.log(products);

            // Check inventory
            const inventory = await dataSource.query(
                'SELECT i.id, i.quantity, i.product_id, i.warehouse_id, i.company_id, p.name as product_name, w.name as warehouse_name FROM inventory i LEFT JOIN products p ON i.product_id = p.id LEFT JOIN warehouses w ON i.warehouse_id = w.id WHERE i.company_id = $1 LIMIT 10',
                [companyId]
            );
            console.log('\n=== INVENTORY ===');
            console.log(inventory);

            // Check total inventory count
            const inventoryCount = await dataSource.query(
                'SELECT COUNT(*) as total_count FROM inventory WHERE company_id = $1',
                [companyId]
            );
            console.log('\n=== INVENTORY COUNT ===');
            console.log(inventoryCount);

            // Check batches
            const batches = await dataSource.query(
                'SELECT id, batch_number, product_id, warehouse_id, company_id FROM batches WHERE company_id = $1 LIMIT 5',
                [companyId]
            );
            console.log('\n=== BATCHES ===');
            console.log(batches);
        }

        await dataSource.destroy();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
}

checkDatabaseData();
