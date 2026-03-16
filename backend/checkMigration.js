const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    try {
        const connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
            database: process.env.DB_NAME || 'room_rental_db'
        });

        const [rows] = await connection.execute('DESCRIBE plans');
        const hasPlanType = rows.some(r => r.Field === 'plan_type');
        
        console.log('plan_type column exists:', hasPlanType);
        
        if (!hasPlanType) {
            console.log('\n⚠️  MIGRATION NEEDED: The plan_type column does not exist.');
            console.log('Please apply the consolidated schema SQL from backend/database/local.sql');
        } else {
            console.log('✅ Database schema is up to date.');
            const [plans] = await connection.execute('SELECT plan_name, plan_type FROM plans WHERE plan_type = "Broker"');
            console.log('\nBroker plans found:', plans.length);
            plans.forEach(p => console.log(' -', p.plan_name, '(', p.plan_type, ')'));
        }

        await connection.end();
    } catch (err) {
        console.error('Error:', err.message);
    }
})();
