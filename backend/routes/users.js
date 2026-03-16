const express = require('express');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { executeQuery } = require('../config/database');
const { authenticate, requireAdmin } = require('../middleware/auth');
const { profileUpload } = require('../middleware/upload');
const { AppError } = require('../middleware/errorHandler');
const { getSupabaseAdmin } = require('../config/supabase');

// Get user profile
router.get('/profile', authenticate, async (req, res, next) => {
    try {
        const users = await executeQuery(
            `SELECT u.id, u.unique_id, u.name, u.email, u.contact, u.gender, 
                    u.pincode, u.role, u.broker_area, u.broker_status, 
                    u.profile_image, u.registration_date, u.last_login,
                    u.two_factor_enabled, u.status, u.contact_visibility,
                    (SELECT COUNT(*) FROM rooms WHERE user_id = u.id) as room_count,
                    (SELECT COUNT(*) FROM rooms WHERE user_id = u.id AND status = 'Approved') as approved_room_count
             FROM users u WHERE u.id = ?`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        next(error);
    }
});

// Update profile
router.put('/profile', authenticate, [
    body('name').optional().trim().notEmpty(),
    body('contact').optional().matches(/^[6-9]\d{9}$/),
    body('gender').optional().isIn(['Male', 'Female', 'Other']),
    body('pincode').optional().matches(/^\d{6}$/),
    body('brokerArea').optional().trim(),
    body('contactVisibility').optional().isIn(['Private', 'Public'])
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { name, contact, gender, pincode, brokerArea, contactVisibility } = req.body;
        const updates = [];
        const values = [];

        if (name) {
            updates.push('name = ?');
            values.push(name);
        }
        if (contact) {
            // Check if contact already exists
            const existing = await executeQuery(
                'SELECT id FROM users WHERE contact = ? AND id != ?',
                [contact, req.user.userId]
            );
            if (existing.length > 0) {
                return res.status(409).json({
                    success: false,
                    message: 'Phone number already registered'
                });
            }
            updates.push('contact = ?');
            values.push(contact);
        }
        if (gender) {
            updates.push('gender = ?');
            values.push(gender);
        }
        if (pincode) {
            updates.push('pincode = ?');
            values.push(pincode);
        }
        if (brokerArea !== undefined && req.user.role === 'Broker') {
            updates.push('broker_area = ?');
            values.push(brokerArea);
        }
        if (contactVisibility !== undefined) {
            updates.push('contact_visibility = ?');
            values.push(contactVisibility);
        }

        if (updates.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update'
            });
        }

        values.push(req.user.userId);

        await executeQuery(
            `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
            values
        );

        // Sync to Supabase if name was updated
        if (name) {
            try {
                const supabaseAdmin = getSupabaseAdmin();
                await supabaseAdmin
                    .from('users')
                    .upsert({ id: req.user.userId, name }, { onConflict: 'id' });
            } catch (error) {
                console.error('Failed to sync profile to Supabase:', error);
                // Don't fail the request if Supabase sync fails
            }
        }

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Change password
router.put('/change-password', authenticate, [
    body('currentPassword').notEmpty(),
    body('newPassword').isLength({ min: 6 })
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { currentPassword, newPassword } = req.body;

        const users = await executeQuery(
            'SELECT password_hash FROM users WHERE id = ?',
            [req.user.userId]
        );

        const isValid = await bcrypt.compare(currentPassword, users[0].password_hash);

        if (!isValid) {
            return res.status(400).json({
                success: false,
                message: 'Current password is incorrect'
            });
        }

        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const newHash = await bcrypt.hash(newPassword, saltRounds);

        await executeQuery(
            'UPDATE users SET password_hash = ? WHERE id = ?',
            [newHash, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Password changed successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Toggle 2FA
router.put('/toggle-2fa', authenticate, async (req, res, next) => {
    try {
        const users = await executeQuery(
            'SELECT two_factor_enabled FROM users WHERE id = ?',
            [req.user.userId]
        );

        const newStatus = !users[0].two_factor_enabled;

        await executeQuery(
            'UPDATE users SET two_factor_enabled = ? WHERE id = ?',
            [newStatus, req.user.userId]
        );

        res.json({
            success: true,
            message: `Two-factor authentication ${newStatus ? 'enabled' : 'disabled'}`,
            data: { twoFactorEnabled: newStatus }
        });

    } catch (error) {
        next(error);
    }
});

// Upload profile image with error handling
router.post('/profile-image', authenticate, (req, res, next) => {
    profileUpload.single('image')(req, res, (err) => {
        if (err instanceof multer.MulterError) {
            if (err.code === 'LIMIT_FILE_SIZE') {
                return res.status(400).json({
                    success: false,
                    message: 'File too large. Maximum size is 5MB.'
                });
            }
            if (err.code === 'LIMIT_UNEXPECTED_FILE') {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid field name. Expected "image".'
                });
            }
        }
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || 'File upload failed'
            });
        }
        next();
    });
}, async (req, res, next) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No image uploaded'
            });
        }

        const imageUrl = `/uploads/profiles/${req.file.filename}`;

        await executeQuery(
            'UPDATE users SET profile_image = ? WHERE id = ?',
            [imageUrl, req.user.userId]
        );

        // Sync to Supabase
        try {
            const supabaseAdmin = getSupabaseAdmin();
            await supabaseAdmin
                .from('users')
                .upsert({ id: req.user.userId, profile_image: imageUrl }, { onConflict: 'id' });
        } catch (error) {
            console.error('Failed to sync profile image to Supabase:', error);
            // Don't fail the request if Supabase sync fails
        }

        res.json({
            success: true,
            message: 'Profile image uploaded successfully',
            data: { imageUrl }
        });

    } catch (error) {
        next(error);
    }
});

// Get user's rooms
router.get('/my-rooms', authenticate, async (req, res, next) => {
    try {
        const { status, page = 1, limit = 10 } = req.query;
        
        let sql = `
            SELECT r.*, 
                   (SELECT COUNT(*) FROM chat_rooms WHERE room_listing_id = r.id) as chat_count
            FROM rooms r 
            WHERE r.user_id = ?
        `;
        const params = [req.user.userId];

        if (status) {
            sql += ' AND r.status = ?';
            params.push(status);
        }

        sql += ' ORDER BY r.post_date DESC';

        const rooms = await executeQuery(sql, params);

        res.json({
            success: true,
            data: rooms,
            pagination: {
                currentPage: parseInt(page),
                totalItems: rooms.length,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        next(error);
    }
});

// Get user's notifications
router.get('/notifications', authenticate, async (req, res, next) => {
    try {
        const { isRead, page = 1, limit = 20 } = req.query;

        let sql = 'SELECT * FROM notifications WHERE user_id = ?';
        const params = [req.user.userId];

        if (isRead !== undefined) {
            sql += ' AND is_read = ?';
            params.push(isRead === 'true' ? 1 : 0);
        }

        sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));

        const notifications = await executeQuery(sql, params);

        // Get unread count
        const unreadCount = await executeQuery(
            'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = FALSE',
            [req.user.userId]
        );

        res.json({
            success: true,
            data: notifications,
            unreadCount: unreadCount[0].count
        });

    } catch (error) {
        next(error);
    }
});

// Mark notification as read
router.put('/notifications/:id/read', authenticate, async (req, res, next) => {
    try {
        await executeQuery(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE id = ? AND user_id = ?',
            [req.params.id, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Notification marked as read'
        });

    } catch (error) {
        next(error);
    }
});

// Mark all notifications as read
router.put('/notifications/read-all', authenticate, async (req, res, next) => {
    try {
        await executeQuery(
            'UPDATE notifications SET is_read = TRUE, read_at = NOW() WHERE user_id = ? AND is_read = FALSE',
            [req.user.userId]
        );

        res.json({
            success: true,
            message: 'All notifications marked as read'
        });

    } catch (error) {
        next(error);
    }
});

// ==================== ADMIN ROUTES ====================

// Get all users (Admin only)
router.get('/admin/all', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const { role, status, search, page = 1, limit = 20 } = req.query;

        let sql = `
            SELECT u.id, u.unique_id, u.name, u.email, u.contact, u.gender,
                   u.city, u.role, u.broker_status, u.status, u.registration_date,
                   u.last_login, u.broker_area,
                   (SELECT COUNT(*) FROM rooms WHERE user_id = u.id) as room_count
            FROM users u
            WHERE 1=1
        `;
        const params = [];

        if (role) {
            sql += ' AND u.role = ?';
            params.push(role);
        }

        if (status) {
            sql += ' AND u.status = ?';
            params.push(status);
        }

        if (search) {
            sql += ' AND (u.name LIKE ? OR u.email LIKE ? OR u.unique_id LIKE ?)';
            const searchTerm = `%${search}%`;
            params.push(searchTerm, searchTerm, searchTerm);
        }

        sql += ' ORDER BY u.registration_date DESC';

        const users = await executeQuery(sql, params);

        // Pagination
        const startIndex = (parseInt(page) - 1) * parseInt(limit);
        const endIndex = startIndex + parseInt(limit);
        const paginatedUsers = users.slice(startIndex, endIndex);

        res.json({
            success: true,
            data: paginatedUsers,
            pagination: {
                currentPage: parseInt(page),
                totalPages: Math.ceil(users.length / parseInt(limit)),
                totalItems: users.length,
                itemsPerPage: parseInt(limit)
            }
        });

    } catch (error) {
        next(error);
    }
});

// Get user by ID (Admin only)
router.get('/admin/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        const users = await executeQuery(
            `SELECT u.*, 
                    (SELECT COUNT(*) FROM rooms WHERE user_id = u.id) as room_count,
                    (SELECT COUNT(*) FROM rooms WHERE user_id = u.id AND status = 'Approved') as approved_room_count
             FROM users u WHERE u.id = ?`,
            [req.params.id]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        // Get user's rooms
        const rooms = await executeQuery(
            'SELECT room_id, title, status, post_date FROM rooms WHERE user_id = ? ORDER BY post_date DESC',
            [req.params.id]
        );

        res.json({
            success: true,
            data: {
                ...users[0],
                rooms
            }
        });

    } catch (error) {
        next(error);
    }
});

// Update user status (Admin only)
router.put('/admin/:id/status', authenticate, requireAdmin, [
    body('status').isIn(['Active', 'Inactive', 'Suspended'])
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { status } = req.body;

        await executeQuery(
            'UPDATE users SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.json({
            success: true,
            message: `User status updated to ${status}`
        });

    } catch (error) {
        next(error);
    }
});

// Get user contact info for chat
router.get('/contact/:userId', authenticate, async (req, res, next) => {
    try {
        const userId = parseInt(req.params.userId);
        
        if (isNaN(userId)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid user ID'
            });
        }

        const users = await executeQuery(
            `SELECT u.id, u.name, u.contact, u.contact_visibility, u.profile_image
             FROM users u WHERE u.id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        res.json({
            success: true,
            data: users[0]
        });

    } catch (error) {
        console.error('Error fetching user contact:', {
            error: error.message,
            userId: req.params.userId,
            stack: error.stack
        });
        next(error);
    }
});

// Update contact visibility
router.put('/contact-visibility', authenticate, [
    body('visibility').isIn(['Private', 'Public'])
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                message: 'Validation failed',
                errors: errors.array()
            });
        }

        const { visibility } = req.body;

        await executeQuery(
            'UPDATE users SET contact_visibility = ? WHERE id = ?',
            [visibility, req.user.userId]
        );

        res.json({
            success: true,
            message: 'Contact visibility updated successfully',
            data: { contact_visibility: visibility }
        });

    } catch (error) {
        next(error);
    }
});

// Delete user (Admin only)
router.delete('/admin/:id', authenticate, requireAdmin, async (req, res, next) => {
    try {
        await executeQuery('DELETE FROM users WHERE id = ?', [req.params.id]);

        res.json({
            success: true,
            message: 'User deleted successfully'
        });

    } catch (error) {
        next(error);
    }
});

module.exports = router;
