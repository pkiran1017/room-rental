const { pool } = require('../config/database');

/**
 * Check if a broker has an active subscription
 * @param {number} userId - User ID to check
 * @returns {Promise<boolean>} - True if broker has active subscription
 */
const hasBrokerSubscription = async (userId) => {
    try {
        const [subscriptions] = await pool.query(`
            SELECT s.id
            FROM subscriptions s
            INNER JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ?
                AND s.payment_status = 'Completed'
                AND p.plan_type = 'Broker'
                AND DATE(s.expires_at) >= CURDATE()
            ORDER BY s.expires_at DESC
            LIMIT 1
        `, [userId]);

        return subscriptions.length > 0;
    } catch (error) {
        console.error('Error checking broker subscription:', error);
        return false;
    }
};

/**
 * Check if a broker's subscription is suspended
 * @param {number} userId - User ID to check
 * @returns {Promise<boolean>} - True if broker's subscription is suspended
 */
const isBrokerSubscriptionSuspended = async (userId) => {
    try {
        const [subscriptions] = await pool.query(`
            SELECT s.id
            FROM subscriptions s
            INNER JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ?
                AND s.payment_status = 'Suspended'
                AND p.plan_type = 'Broker'
            ORDER BY s.created_at DESC
            LIMIT 1
        `, [userId]);

        return subscriptions.length > 0;
    } catch (error) {
        console.error('Error checking broker subscription suspension:', error);
        return false;
    }
};

/**
 * Get broker's active subscription details
 * @param {number} userId - User ID
 * @returns {Promise<object|null>} - Subscription object or null
 */
const getBrokerSubscriptionDetails = async (userId) => {
    try {
        const [subscriptions] = await pool.query(`
            SELECT s.*, p.plan_name, p.plan_type, p.plan_code
            FROM subscriptions s
            INNER JOIN plans p ON s.plan_id = p.id
            WHERE s.user_id = ?
                AND s.payment_status = 'Completed'
                AND p.plan_type = 'Broker'
                AND DATE(s.expires_at) >= CURDATE()
            ORDER BY s.expires_at DESC
            LIMIT 1
        `, [userId]);

        if (subscriptions.length === 0) {
            return null;
        }

        return subscriptions[0];
    } catch (error) {
        console.error('Error getting broker subscription details:', error);
        return null;
    }
};

/**
 * Middleware to check if user is broker with active subscription
 * Sets req.hasBrokerSubscription = true if broker has active subscription
 * Sets req.isSubscriptionSuspended = true if broker's subscription is suspended
 */
const checkBrokerSubscription = async (req, res, next) => {
    try {
        if (req.user && req.user.role === 'Broker') {
            req.hasBrokerSubscription = await hasBrokerSubscription(req.user.userId);
            req.brokerSubscription = await getBrokerSubscriptionDetails(req.user.userId);
            req.isSubscriptionSuspended = await isBrokerSubscriptionSuspended(req.user.userId);
        } else {
            req.hasBrokerSubscription = false;
            req.brokerSubscription = null;
            req.isSubscriptionSuspended = false;
        }
        next();
    } catch (error) {
        console.error('Error in checkBrokerSubscription middleware:', error);
        req.hasBrokerSubscription = false;
        req.brokerSubscription = null;
        req.isSubscriptionSuspended = false;
        next();
    }
};

module.exports = {
    hasBrokerSubscription,
    getBrokerSubscriptionDetails,
    isBrokerSubscriptionSuspended,
    checkBrokerSubscription
};
