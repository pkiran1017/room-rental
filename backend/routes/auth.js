const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { executeQuery } = require('../config/database');
const { authenticate } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { getSupabaseAdmin } = require('../config/supabase');
const { 
    generateUserId, 
    generateOTP, 
    isValidEmail, 
    isValidPhone, 
    isValidPincode 
} = require('../utils/helpers');
const { 
    sendOTPEmail, 
    sendWelcomeEmail, 
    sendPasswordResetEmail 
} = require('../utils/email');
const {
    authRateLimiter,
    isStrongPassword,
    isValidEmail: validateEmail,
    isValidPhone: validatePhone
} = require('../middleware/security');

// Register new user
router.post('/register', authRateLimiter, [
    body('name').trim().notEmpty().withMessage('Name is required').isLength({ max: 100 }).withMessage('Name must be less than 100 characters'),
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('contact').matches(/^[6-9]\d{9}$/).withMessage('Valid 10-digit phone number is required'),
    body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender is required'),
    body('pincode').matches(/^\d{6}$/).withMessage('Valid 6-digit PIN code is required'),
    body('password')
        .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
        .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).withMessage('Password must contain at least one uppercase letter, one lowercase letter, and one number'),
    body('role').isIn(['Member', 'Broker']).withMessage('Role must be Member or Broker'),
    body('brokerArea').optional().trim().isLength({ max: 200 }).withMessage('Broker area must be less than 200 characters'),
    body('selectedPlanId').optional().isInt({ min: 1 }).withMessage('Valid plan ID is required for brokers')
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

        const { name, email, contact, gender, pincode, password, role, brokerArea, selectedPlanId } = req.body;

        // If broker role, plan selection is required
        if (role === 'Broker' && !selectedPlanId) {
            return res.status(400).json({
                success: false,
                message: 'Plan selection is required for brokers'
            });
        }

        // Validate plan if broker
        let validPlan = null;
        if (role === 'Broker' && selectedPlanId) {
            const [plans] = await executeQuery(
                'SELECT id, plan_name, plan_type FROM plans WHERE id = ? AND is_active = TRUE AND plan_type = "Broker"',
                [selectedPlanId]
            );

            if (plans.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Selected plan is invalid or not available for brokers'
                });
            }
            validPlan = plans[0];
        }

        // Check if email already exists
        const existingUser = await executeQuery(
            'SELECT id FROM users WHERE email = ?',
            [email]
        );

        if (existingUser.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Email already registered',
                field: 'email'
            });
        }

        // Check if contact already exists
        const existingContact = await executeQuery(
            'SELECT id FROM users WHERE contact = ?',
            [contact]
        );

        if (existingContact.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Phone number already registered',
                field: 'contact'
            });
        }

        // Generate unique ID
        let uniqueId;
        let isUnique = false;
        while (!isUnique) {
            uniqueId = generateUserId();
            const existing = await executeQuery(
                'SELECT id FROM users WHERE unique_id = ?',
                [uniqueId]
            );
            if (existing.length === 0) isUnique = true;
        }

        // Hash password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        // Generate OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Determine broker status
        const brokerStatus = role === 'Broker' ? 'Pending' : null;

        const baseInsertSql = `INSERT INTO users (
                unique_id, name, email, contact, gender, pincode, 
                password_hash, role, broker_area, broker_status, selected_plan_id,
                otp_code, otp_expires_at, is_verified, registration_date, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Active')`;
        const baseInsertParams = [
            uniqueId, name, email, contact, gender, pincode,
            passwordHash, role, brokerArea || null, brokerStatus, selectedPlanId || null,
            otp, otpExpiresAt, false
        ];

        let result;
        let insertedUserId;

        try {
            // Preferred path when id is AUTO_INCREMENT.
            result = await executeQuery(baseInsertSql, baseInsertParams);
            insertedUserId = result.insertId;
        } catch (insertError) {
            const missingIdDefault =
                insertError &&
                insertError.code === 'ER_NO_DEFAULT_FOR_FIELD' &&
                insertError.message &&
                insertError.message.includes("Field 'id'");

            if (!missingIdDefault) {
                throw insertError;
            }

            // Fallback path for imported schemas where users.id is not AUTO_INCREMENT.
            for (let attempt = 0; attempt < 3; attempt += 1) {
                const maxRows = await executeQuery('SELECT COALESCE(MAX(id), 0) AS maxId FROM users');
                const nextId = Number(maxRows[0]?.maxId || 0) + 1;

                try {
                    const fallbackResult = await executeQuery(
                        `INSERT INTO users (
                            id, unique_id, name, email, contact, gender, pincode,
                            password_hash, role, broker_area, broker_status, selected_plan_id,
                            otp_code, otp_expires_at, is_verified, registration_date, status
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Active')`,
                        [nextId, ...baseInsertParams]
                    );

                    result = fallbackResult;
                    insertedUserId = nextId;
                    break;
                } catch (fallbackError) {
                    if (fallbackError?.code === 'ER_DUP_ENTRY' && attempt < 2) {
                        continue;
                    }
                    throw fallbackError;
                }
            }
        }

        // Send OTP email
        await sendOTPEmail(email, otp, name);

        // If broker, send notification to admin (optional)
        if (role === 'Broker') {
            // TODO: Send admin notification about pending broker approval
        }

        res.status(201).json({
            success: true,
            message: 'Registration successful. Please verify your email with OTP.',
            data: {
                userId: insertedUserId || result.insertId,
                uniqueId,
                email,
                role,
                brokerStatus,
                selectedPlan: validPlan ? { id: validPlan.id, name: validPlan.plan_name } : null,
                requiresVerification: true
            }
        });

    } catch (error) {
        next(error);
    }
});

// Verify OTP
router.post('/verify-otp', [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required'),
    body('isShortcutRegistration').optional().isBoolean().withMessage('isShortcutRegistration must be boolean'),
    body('tempPassword').optional().isLength({ min: 8, max: 128 }).withMessage('Valid temp password is required')
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

        const { email, otp, isShortcutRegistration = false, tempPassword } = req.body;

        const users = await executeQuery(
            'SELECT id, unique_id, name, email, otp_code, otp_expires_at, is_verified, role, broker_status FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        if (user.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Mark user as verified
        await executeQuery(
            'UPDATE users SET is_verified = TRUE, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [user.id]
        );

        // Send welcome email
        await sendWelcomeEmail(email, user.name, user.unique_id, {
            temporaryPassword: isShortcutRegistration ? tempPassword : undefined,
        });

        res.json({
            success: true,
            message: 'Email verified successfully',
            data: {
                userId: user.id,
                uniqueId: user.unique_id,
                email: user.email,
                role: user.role,
                brokerStatus: user.broker_status
            }
        });

    } catch (error) {
        next(error);
    }
});

// Resend OTP
router.post('/resend-otp', [
    body('email').isEmail().withMessage('Valid email is required')
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

        const { email } = req.body;

        const users = await executeQuery(
            'SELECT id, name, is_verified FROM users WHERE email = ?',
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (user.is_verified) {
            return res.status(400).json({
                success: false,
                message: 'Email already verified'
            });
        }

        // Generate new OTP
        const otp = generateOTP();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await executeQuery(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
            [otp, otpExpiresAt, user.id]
        );

        // Send OTP email
        await sendOTPEmail(email, otp, user.name);

        res.json({
            success: true,
            message: 'OTP sent successfully'
        });

    } catch (error) {
        next(error);
    }
});

// Login
router.post('/login', authRateLimiter, [
    body('email').isEmail().withMessage('Valid email is required').normalizeEmail(),
    body('password').notEmpty().withMessage('Password is required')
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

        const { email, password } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const deviceInfo = req.headers['user-agent'];

        const users = await executeQuery(
            `SELECT id, unique_id, name, email, password_hash, role, 
                    broker_status, is_verified, status, two_factor_enabled
             FROM users WHERE email = ?`,
            [email]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not registered. Please register and continue.',
                data: {
                    requiresRegistration: true,
                    email
                }
            });
        }

        const user = users[0];

        if (user.status !== 'Active') {
            return res.status(403).json({
                success: false,
                message: 'Account is inactive or suspended'
            });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);

        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        // Check if email is verified
        if (!user.is_verified) {
            // Generate new OTP for verification
            const otp = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await executeQuery(
                'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
                [otp, otpExpiresAt, user.id]
            );

            await sendOTPEmail(email, otp, user.name);

            return res.status(403).json({
                success: false,
                message: 'Email not verified. OTP sent for verification.',
                data: {
                    requiresVerification: true,
                    email: user.email
                }
            });
        }

        // Check if broker is approved or suspended
        if (user.role === 'Broker') {
            if (user.broker_status === 'Suspended') {
                return res.status(403).json({
                    success: false,
                    message: 'Your broker account has been suspended. Please contact admin.',
                    data: {
                        brokerStatus: user.broker_status
                    }
                });
            }
            
            if (user.broker_status !== 'Approved') {
                return res.status(403).json({
                    success: false,
                    message: `Broker account is ${user.broker_status.toLowerCase()}. Please wait for admin approval.`,
                    data: {
                        brokerStatus: user.broker_status
                    }
                });
            }
        }

        // If 2FA is enabled, send OTP
        if (user.two_factor_enabled) {
            const otp = generateOTP();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

            await executeQuery(
                'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
                [otp, otpExpiresAt, user.id]
            );

            await sendOTPEmail(email, otp, user.name);

            return res.json({
                success: true,
                message: '2FA required. OTP sent to your email.',
                data: {
                    requires2FA: true,
                    userId: user.id,
                    email: user.email
                }
            });
        }

        // Update last login
        await executeQuery(
            'UPDATE users SET last_login = NOW(), ip_address = ?, device_info = ? WHERE id = ?',
            [ipAddress, deviceInfo, user.id]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    userId: user.id,
                    uniqueId: user.unique_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    brokerStatus: user.broker_status
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// Verify 2FA and complete login
router.post('/verify-2fa', [
    body('userId').isInt().withMessage('Valid user ID is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('Valid 6-digit OTP is required')
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

        const { userId, otp } = req.body;
        const ipAddress = req.ip || req.connection.remoteAddress;
        const deviceInfo = req.headers['user-agent'];

        const users = await executeQuery(
            `SELECT id, unique_id, name, email, role, broker_status, otp_code, otp_expires_at
             FROM users WHERE id = ?`,
            [userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        if (user.otp_code !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP'
            });
        }

        if (new Date() > new Date(user.otp_expires_at)) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired'
            });
        }

        // Clear OTP
        await executeQuery(
            'UPDATE users SET otp_code = NULL, otp_expires_at = NULL, last_login = NOW(), ip_address = ?, device_info = ? WHERE id = ?',
            [ipAddress, deviceInfo, userId]
        );

        // Generate JWT token
        const token = jwt.sign(
            { userId: user.id, email: user.email, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token,
                user: {
                    userId: user.id,
                    uniqueId: user.unique_id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    brokerStatus: user.broker_status
                }
            }
        });

    } catch (error) {
        next(error);
    }
});

// Forgot password
router.post('/forgot-password', [
    body('email').isEmail().withMessage('Valid email is required')
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

        const { email } = req.body;

        const users = await executeQuery(
            'SELECT id, name FROM users WHERE email = ? AND is_verified = TRUE',
            [email]
        );

        if (users.length === 0) {
            // Don't reveal if email exists
            return res.json({
                success: true,
                message: 'If your email is registered, you will receive a password reset link.'
            });
        }

        const user = users[0];

        // Generate reset token
        const resetToken = require('crypto').randomBytes(32).toString('hex');
        const resetExpiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await executeQuery(
            'UPDATE users SET otp_code = ?, otp_expires_at = ? WHERE id = ?',
            [resetToken, resetExpiresAt, user.id]
        );

        // Send password reset email
        await sendPasswordResetEmail(email, user.name, resetToken);

        res.json({
            success: true,
            message: 'If your email is registered, you will receive a password reset link.'
        });

    } catch (error) {
        next(error);
    }
});

// Reset password
router.post('/reset-password', [
    body('token').notEmpty().withMessage('Reset token is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
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

        const { token, password } = req.body;

        const users = await executeQuery(
            'SELECT id FROM users WHERE otp_code = ? AND otp_expires_at > NOW()',
            [token]
        );

        if (users.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired reset token'
            });
        }

        const userId = users[0].id;

        // Hash new password
        const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
        const passwordHash = await bcrypt.hash(password, saltRounds);

        await executeQuery(
            'UPDATE users SET password_hash = ?, otp_code = NULL, otp_expires_at = NULL WHERE id = ?',
            [passwordHash, userId]
        );

        res.json({
            success: true,
            message: 'Password reset successful. Please login with your new password.'
        });

    } catch (error) {
        next(error);
    }
});

// Get current user
router.get('/me', authenticate, async (req, res, next) => {
    try {
        const users = await executeQuery(
            `SELECT id, unique_id, name, email, contact, gender, pincode, 
                    role, broker_area, broker_status, profile_image, 
                    registration_date, last_login, two_factor_enabled
             FROM users WHERE id = ?`,
            [req.user.userId]
        );

        if (users.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'User not found'
            });
        }

        const user = users[0];

        // Sync user data to Supabase for chat functionality
        try {
            const supabaseAdmin = getSupabaseAdmin();
            await supabaseAdmin
                .from('users')
                .upsert({ 
                    id: user.id, 
                    name: user.name, 
                    profile_image: user.profile_image 
                }, { onConflict: 'id' });
        } catch (error) {
            console.error('Failed to sync user to Supabase:', error);
            // Don't fail the request if Supabase sync fails
        }

        res.json({
            success: true,
            data: user
        });

    } catch (error) {
        next(error);
    }
});

// Logout (optional - for token blacklist if needed)
router.post('/logout', authenticate, async (req, res) => {
    // In a more advanced implementation, you might want to blacklist the token
    res.json({
        success: true,
        message: 'Logout successful'
    });
});

module.exports = router;
