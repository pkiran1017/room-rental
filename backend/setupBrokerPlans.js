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
        console.log('Setting up broker plans...');

        // Delete existing broker plans
        await connection.execute('DELETE FROM plans WHERE plan_type = "Broker"');
        console.log('✅ Cleared old broker plans');

        // Insert new broker plans
        const plans = [
            {
                plan_name: 'Broker Monthly',
                plan_code: 'BRK_MONTHLY',
                plan_type: 'Broker',
                price: 999,
                duration_days: 30,
                features: JSON.stringify({
                    postings: 'Unlimited',
                    duration: '30 days',
                    autoApproval: true,
                    editAnytime: true,
                    priority: 'Medium'
                }),
                description: 'Post unlimited rooms for 1 month with auto-approval'
            },
            {
                plan_name: 'Broker Yearly',
                plan_code: 'BRK_YEARLY',
                plan_type: 'Broker',
                price: 9999,
                duration_days: 365,
                features: JSON.stringify({
                    postings: 'Unlimited',
                    duration: '365 days',
                    autoApproval: true,
                    editAnytime: true,
                    priority: 'High',
                    discount: '20% off'
                }),
                description: 'Post unlimited rooms for 1 year with auto-approval (Best Value - 20% discount)'
            }
        ];

        for (const plan of plans) {
            await connection.execute(
                `INSERT INTO plans (plan_name, plan_code, plan_type, price, duration_days, features, description, is_active)
                 VALUES (?, ?, ?, ?, ?, ?, ?, TRUE)`,
                [plan.plan_name, plan.plan_code, plan.plan_type, plan.price, plan.duration_days, plan.features, plan.description]
            );
        }

        console.log('✅ Created 2 broker plans:');
        console.log('   - Broker Monthly: ₹999 for 30 days');
        console.log('   - Broker Yearly: ₹9999 for 365 days (20% off)');
        console.log('✅ Plans setup completed successfully!');

    } catch (error) {
        console.error('❌ Error setting up plans:', error.message);
    } finally {
        await connection.end();
    }
})();
