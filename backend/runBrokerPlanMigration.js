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
        console.log('Running migration: Add broker plan selection...');
        
        // Check if column already exists
        const [columns] = await connection.execute('DESCRIBE users');
        const hasSelectedPlanId = columns.some(col => col.Field === 'selected_plan_id');
        
        if (hasSelectedPlanId) {
            console.log('✅ Column selected_plan_id already exists');
        } else {
            await connection.execute('ALTER TABLE users ADD COLUMN selected_plan_id INT NULL COMMENT "Plan selected by broker during registration"');
            await connection.execute('ALTER TABLE users ADD FOREIGN KEY (selected_plan_id) REFERENCES plans(id)');
            console.log('✅ Added selected_plan_id column to users table');
        }

        // Check if index exists
        const [indexes] = await connection.execute('SHOW INDEX FROM users WHERE Key_name = "idx_broker_selected_plan"');
        if (indexes.length === 0) {
            await connection.execute('CREATE INDEX idx_broker_selected_plan ON users(selected_plan_id)');
            console.log('✅ Created index for broker plan selection');
        } else {
            console.log('✅ Index already exists');
        }

        console.log('✅ Migration completed successfully!');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await connection.end();
    }
})();
