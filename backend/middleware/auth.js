const jwt = require('jsonwebtoken');
const { executeQuery } = require('../config/database');

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.'
            });
        }

        const token = authHeader.split(' ')[1];
        
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        // Check if user still exists and is active
        const users = await executeQuery(
            'SELECT id, unique_id, name, email, role, status, broker_status FROM users WHERE id = ?',
            [decoded.userId]
        );

        if (users.length === 0) {
            return res.status(401).json({
                success: false,
                message: 'User not found.'
            });
        }

        const user = users[0];

        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive or suspended.'
            });
        }

        // Check if broker is suspended
        if (user.role === 'Broker' && user.broker_status === 'Suspended') {
            return res.status(403).json({
                success: false,
                message: 'Your broker account has been suspended. Please contact admin.'
            });
        }

        // Attach user info to request
        req.user = {
            userId: user.id,
            uniqueId: user.unique_id,
            name: user.name,
            email: user.email,
            role: user.role,
            brokerStatus: user.broker_status
        };

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.'
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired.'
            });
        }

        console.error('Auth middleware error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication error.'
        });
    }
};

// Check if user is Admin
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Admin privileges required.'
        });
    }
    next();
};

// Check if user is Member, Broker, or Admin
const requireMember = (req, res, next) => {
    if (req.user.role !== 'Member' && req.user.role !== 'Broker' && req.user.role !== 'Admin') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Member privileges required.'
        });
    }
    next();
};

// Check if user is approved Broker
const requireApprovedBroker = (req, res, next) => {
    if (req.user.role === 'Broker' && req.user.brokerStatus !== 'Approved') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Broker approval pending.'
        });
    }
    next();
};

// Optional authentication (for public routes that can also work with auth)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            req.user = null;
            return next();
        }

        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        
        const users = await executeQuery(
            'SELECT id, unique_id, name, email, role, status FROM users WHERE id = ? AND status = ?',
            [decoded.userId, 'Active']
        );

        if (users.length > 0) {
            req.user = {
                userId: users[0].id,
                uniqueId: users[0].unique_id,
                name: users[0].name,
                email: users[0].email,
                role: users[0].role
            };
        } else {
            req.user = null;
        }

        next();
    } catch (error) {
        req.user = null;
        next();
    }
};

module.exports = {
    authenticate,
    requireAdmin,
    requireMember,
    requireApprovedBroker,
    optionalAuth
};
