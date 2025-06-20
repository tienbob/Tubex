const { AppDataSource } = require('./dist/database/index.js');

async function testDatabaseConnection() {
    try {
        console.log('Testing database connection...');
        
        if (!AppDataSource.isInitialized) {
            await AppDataSource.initialize();
            console.log('✅ Database connection established successfully!');
        }
        
        // Test basic queries
        const result = await AppDataSource.query('SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = \'public\'');
        console.log(`✅ Database has ${result[0].table_count} tables`);
        
        // Test specific tables exist
        const tables = await AppDataSource.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            ORDER BY table_name
        `);
        
        console.log('✅ Tables in database:');
        tables.forEach(table => console.log(`  - ${table.table_name}`));
        
        // Test ENUMs exist
        const enums = await AppDataSource.query(`
            SELECT typname as enum_name 
            FROM pg_type 
            WHERE typtype = 'e' 
            ORDER BY typname
        `);
        
        console.log('✅ ENUMs in database:');
        enums.forEach(e => console.log(`  - ${e.enum_name}`));
        
        await AppDataSource.destroy();
        console.log('✅ Test completed successfully!');
        
    } catch (error) {
        console.error('❌ Database connection test failed:', error);
        process.exit(1);
    }
}

testDatabaseConnection();
