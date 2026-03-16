const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: process.env.DB_PORT || 3306,
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'room_rental_db'
    });

    try {
        const [plans] = await connection.execute(`
            SELECT id, plan_name, plan_code, plan_type, price, duration_days, description, is_active 
            FROM plans 
            WHERE plan_type = 'Broker'
            ORDER BY price ASC
        `);

        console.log('\n📋 Broker Plans in Database:');
        console.log('================================');
        plans.forEach(plan => {
            console.log(`\n✓ ${plan.plan_name}`);
            console.log(`  - Code: ${plan.plan_code}`);
            console.log(`  - Price: ₹${plan.price}`);
            console.log(`  - Duration: ${plan.duration_days} days`);
            console.log(`  - Description: ${plan.description}`);
            console.log(`  - Active: ${plan.is_active ? 'Yes' : 'No'}`);
        });
        console.log('\n================================');
        console.log(`✅ Total: ${plans.length} broker plans found`);

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await connection.end();
    }
})();
