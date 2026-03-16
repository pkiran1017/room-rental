const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const { executeQuery, withTransaction } = require('../config/database');
const { authenticate, requireMember } = require('../middleware/auth');
const { generateExpenseId, generateGroupId } = require('../utils/helpers');
const { sendExpenseNotificationEmail, sendEmail, getEmailBranding } = require('../utils/email');

let ensureExpenseGroupSchemaPromise = null;
let ensureExpenseSchemaPromise = null;

const ensureExpenseSchema = async () => {
    if (!ensureExpenseSchemaPromise) {
        ensureExpenseSchemaPromise = (async () => {
            const columns = await executeQuery('SHOW COLUMNS FROM expenses');
            const names = new Set(columns.map((column) => column.Field));

            if (!names.has('expense_category')) {
                await executeQuery("ALTER TABLE expenses ADD COLUMN expense_category VARCHAR(20) NOT NULL DEFAULT 'Daily' AFTER group_id");
            }
            if (!names.has('trip_label')) {
                await executeQuery('ALTER TABLE expenses ADD COLUMN trip_label VARCHAR(150) NULL AFTER expense_category');
            }
        })().catch((error) => {
            ensureExpenseSchemaPromise = null;
            throw error;
        });
    }

    return ensureExpenseSchemaPromise;
};

const ensureExpenseGroupSchema = async () => {
    if (!ensureExpenseGroupSchemaPromise) {
        ensureExpenseGroupSchemaPromise = (async () => {
            const columns = await executeQuery('SHOW COLUMNS FROM roommate_groups');
            const names = new Set(columns.map((column) => column.Field));

            if (!names.has('expense_category')) {
                await executeQuery("ALTER TABLE roommate_groups ADD COLUMN expense_category VARCHAR(20) NOT NULL DEFAULT 'Daily' AFTER group_name");
            }
            if (!names.has('expense_status')) {
                await executeQuery("ALTER TABLE roommate_groups ADD COLUMN expense_status VARCHAR(20) NOT NULL DEFAULT 'Ongoing' AFTER expense_category");
            }
            if (!names.has('expense_label')) {
                await executeQuery('ALTER TABLE roommate_groups ADD COLUMN expense_label VARCHAR(180) NULL AFTER expense_category');
            }
            if (!names.has('allow_member_edit_history')) {
                await executeQuery('ALTER TABLE roommate_groups ADD COLUMN allow_member_edit_history TINYINT(1) NOT NULL DEFAULT 0 AFTER expense_status');
            }
            if (!names.has('closed_at')) {
                await executeQuery('ALTER TABLE roommate_groups ADD COLUMN closed_at TIMESTAMP NULL DEFAULT NULL AFTER allow_member_edit_history');
            }
            if (!names.has('admin_upi_id')) {
                await executeQuery('ALTER TABLE roommate_groups ADD COLUMN admin_upi_id VARCHAR(120) NULL AFTER closed_at');
            }
            if (!names.has('admin_scanner_url')) {
                await executeQuery('ALTER TABLE roommate_groups ADD COLUMN admin_scanner_url TEXT NULL AFTER admin_upi_id');
            }
            if (!names.has('admin_drive_link')) {
                await executeQuery('ALTER TABLE roommate_groups ADD COLUMN admin_drive_link TEXT NULL AFTER admin_scanner_url');
            }
        })().catch((error) => {
            ensureExpenseGroupSchemaPromise = null;
            throw error;
        });
    }

    return ensureExpenseGroupSchemaPromise;
};

const ACCESS_FILTER_SQL = `
    status = 'Accepted'
    AND (
        user_id = ?
        OR invited_by = ?
        OR linked_user_id = ?
        OR (? IS NOT NULL AND LOWER(email) = LOWER(?))
    )
`;

const getCurrentUserEmail = async (userId) => {
    const rows = await executeQuery('SELECT email FROM users WHERE id = ? LIMIT 1', [userId]);
    return rows[0]?.email || null;
};

const getAccessParams = (userId, email) => [userId, userId, userId, email, email];

const buildExpenseAccessCondition = (alias) => `${alias ? `${alias}.group_id` : 'group_id'} IN (
    SELECT group_id
    FROM roommates
    WHERE ${ACCESS_FILTER_SQL}
)`;

const round2 = (value) => Math.round((Number(value) + Number.EPSILON) * 100) / 100;

const getCurrentMonthExpenseLabel = () => {
    const monthName = new Date().toLocaleString('en-US', { month: 'long' });
    return `${monthName} Expense`;
};

const calculateEqualSplitAmounts = (total, count) => {
    if (count <= 0) return [];

    const perHead = round2(total / count);
    const amounts = [];

    for (let i = 0; i < count; i += 1) {
        if (i === count - 1) {
            const distributed = amounts.reduce((sum, amount) => sum + amount, 0);
            amounts.push(round2(total - distributed));
        } else {
            amounts.push(perHead);
        }
    }

    return amounts;
};

const sanitizeWhatsAppNumber = (raw) => {
    if (!raw) return null;

    let digits = String(raw).replace(/\D/g, '');
    if (!digits) return null;

    if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.slice(1);
    }

    if (digits.length === 10) {
        return `91${digits}`;
    }

    if (digits.length === 12 && digits.startsWith('91')) {
        return digits;
    }

    return null;
};

const buildWhatsAppLink = (contact, message) => {
    const number = sanitizeWhatsAppNumber(contact);
    if (!number) return null;
    return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
};

const generateUniqueGroupId = async (connection) => {
    let uniqueGroupId = null;

    while (!uniqueGroupId) {
        const candidate = generateGroupId();
        const [existingInGroups] = await connection.execute(
            'SELECT id FROM roommate_groups WHERE group_id = ? LIMIT 1',
            [candidate]
        );

        if (existingInGroups.length === 0) {
            uniqueGroupId = candidate;
        }
    }

    return uniqueGroupId;
};

const ensureGroupAccess = async (groupId, userId, email) => {
    const rows = await executeQuery(
        `SELECT id
         FROM roommates
         WHERE group_id = ?
           AND ${ACCESS_FILTER_SQL}
         LIMIT 1`,
        [groupId, ...getAccessParams(userId, email)]
    );

    return rows.length > 0;
};

const canEditExpenseHistory = async (groupId, createdBy, userId, userEmail) => {
    const hasGroupAccess = await ensureGroupAccess(groupId, userId, userEmail);
    if (!hasGroupAccess) {
        return false;
    }

    if (createdBy === userId) {
        return true;
    }

    const rows = await executeQuery(
        'SELECT created_by, allow_member_edit_history FROM roommate_groups WHERE group_id = ? LIMIT 1',
        [groupId]
    );

    if (rows.length === 0) {
        return false;
    }

    return rows[0].created_by === userId || Boolean(rows[0].allow_member_edit_history);
};

const getGroupSettlementSummary = async (groupId, roommateId) => {
    const groupRows = await executeQuery(
        `SELECT group_name, expense_label, admin_upi_id, admin_scanner_url, admin_drive_link
         FROM roommate_groups
         WHERE group_id = ?
         LIMIT 1`,
        [groupId]
    );

    const groupName = groupRows[0]?.expense_label || groupRows[0]?.group_name || `Group ${groupId}`;
    const adminUpiId = groupRows[0]?.admin_upi_id || null;
    const adminScannerUrl = groupRows[0]?.admin_scanner_url || null;
    const adminDriveLink = groupRows[0]?.admin_drive_link || null;

    const members = await executeQuery(
        `SELECT r.id, r.name, r.email, r.contact, r.user_id, r.linked_user_id
         FROM roommates r
         WHERE r.group_id = ? AND r.status = 'Accepted'`,
        [groupId]
    );

    if (members.length === 0) {
        return null;
    }

    const target = members.find((member) => member.id === Number(roommateId));
    if (!target) {
        return null;
    }

    const expenses = await executeQuery(
        `SELECT e.expense_id, e.title, e.cost, e.paid_by, u.name as paid_by_name
         FROM expenses e
         JOIN users u ON u.id = e.paid_by
         WHERE e.group_id = ?
         ORDER BY e.expense_date ASC, e.created_at ASC`,
        [groupId]
    );

    const totalSpent = expenses.reduce((sum, expense) => sum + Number(expense.cost || 0), 0);
    const totalMembers = members.length;
    const equalShare = totalMembers > 0 ? round2(totalSpent / totalMembers) : 0;

    const targetUserId = target.linked_user_id || target.user_id || null;
    const alreadyPaid = targetUserId
        ? expenses
            .filter((expense) => Number(expense.paid_by) === Number(targetUserId))
            .reduce((sum, expense) => sum + Number(expense.cost || 0), 0)
        : 0;

    const dueAmount = round2(equalShare - alreadyPaid);

    const expenseLines = expenses.map((expense) => {
        const paidByYou = targetUserId && Number(expense.paid_by) === Number(targetUserId);
        return {
            title: expense.title,
            amount: Number(expense.cost || 0),
            paidBy: paidByYou ? 'You' : expense.paid_by_name,
        };
    });

    return {
        groupName,
        adminUpiId,
        adminScannerUrl,
        adminDriveLink,
        target,
        totalSpent: round2(totalSpent),
        totalMembers,
        equalShare,
        alreadyPaid: round2(alreadyPaid),
        dueAmount,
        expenseLines,
    };
};

const buildSettlementSummaryMessage = (summary, groupId) => {
    const dueLine = summary.dueAmount > 0
        ? `Due is ${summary.dueAmount}`
        : summary.dueAmount < 0
            ? `You already settled all. You should collect ${Math.abs(summary.dueAmount)} from others.`
            : 'No due. Already settled.';

    return [
        `Your Expense split of Group: (${summary.groupName}) and id (${groupId})`,
        '..............................................',
        'Expence List,',
        ...summary.expenseLines.map((line) => `${line.title} ${line.amount} paid by ${line.paidBy}`),
        '--------------------------',
        `Total ${summary.totalSpent}/${summary.totalMembers} = ${summary.equalShare} - ${summary.alreadyPaid} (you already paid)`,
        dueLine,
    ];
};

const buildUpiPaymentLink = (upiId, amount, groupName) => {
    const normalizedUpi = String(upiId || '').trim();
    if (!normalizedUpi) return null;

    const numericAmount = Number(amount || 0);
    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return null;
    }

    const formattedAmount = numericAmount.toFixed(2);
    const params = new URLSearchParams({
        pa: normalizedUpi,
        pn: groupName || 'Expense Group',
        am: formattedAmount,
        cu: 'INR',
        tn: `Expense split for ${groupName || 'Group'}`,
    });

    return `upi://pay?${params.toString()}`;
};

const appendAdminCollectionDetails = (messageLines, adminUpiId, adminScannerUrl, adminDriveLink, dueAmount, groupName) => {
    const trimmedUpi = String(adminUpiId || '').trim();
    const trimmedScanner = String(adminScannerUrl || '').trim();
    const trimmedDriveLink = String(adminDriveLink || '').trim();

    if (!trimmedUpi && !trimmedScanner && !trimmedDriveLink) {
        return messageLines;
    }

    const paymentLink = buildUpiPaymentLink(trimmedUpi, dueAmount, groupName);

    const enriched = [...messageLines, '', 'Admin Collection Details:'];
    if (trimmedUpi) {
        enriched.push(`UPI ID: ${trimmedUpi}`);
    }
    if (paymentLink) {
        enriched.push(`Pay UPI Link: ${paymentLink}`);
    }
    if (trimmedScanner) {
        enriched.push(`Scanner: ${trimmedScanner}`);
    }
    if (trimmedDriveLink) {
        enriched.push(`Trip Photos/Videos: ${trimmedDriveLink}`);
    }
    return enriched;
};

const buildReminderEmailHtml = ({
    targetName,
    groupName,
    groupId,
    reminderLines,
    scannerUrl,
    businessName,
    supportEmail,
}) => {
    const scannerSection = scannerUrl
        ? `<div style="margin-top:16px;">
                <p style="margin:0 0 8px 0;"><strong>Scanner:</strong></p>
                <img src="${scannerUrl}" alt="Payment scanner" style="max-width:260px;width:100%;height:auto;border:1px solid #e5e7eb;border-radius:8px;" />
           </div>`
        : '';

    return `
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; background:#eef6f2; margin:0; padding:24px; color:#0f172a;">
            <div style="max-width:680px;margin:0 auto;background:#ffffff;border:1px solid #d9e8df;border-radius:18px;overflow:hidden;box-shadow:0 18px 45px rgba(15,23,42,0.08);">
                <div style="padding:24px 28px;background:linear-gradient(135deg,#0f766e,#14532d);color:#ffffff;">
                    <p style="margin:0;font-size:12px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.85;">Expense Reminder</p>
                    <h1 style="margin:10px 0 0 0;font-size:28px;line-height:1.2;">${businessName}</h1>
                    <p style="margin:8px 0 0 0;font-size:14px;opacity:0.9;">Shared expense settlement notice for your group.</p>
                </div>
                <div style="padding:28px;">
                <p style="margin:0 0 10px 0;">Hello ${targetName || 'Member'},</p>
                <p style="margin:0 0 14px 0;">Please review your settlement for group <strong>${groupName}</strong> (${groupId}).</p>
                <pre style="white-space:pre-wrap;background:#f8fafc;padding:16px;border-radius:12px;border:1px solid #e2e8f0;font-size:14px;line-height:1.6;">${reminderLines.join('\n')}</pre>
                ${scannerSection}
                <div style="margin-top:20px;padding:16px;border-radius:12px;background:#f8fafc;border:1px solid #e2e8f0;">
                    <p style="margin:0 0 6px 0;font-weight:600;">Need help?</p>
                    <p style="margin:0;font-size:14px;">Support: <a href="mailto:${supportEmail}" style="color:#0f766e;text-decoration:none;">${supportEmail}</a></p>
                </div>
                <p style="margin-top:16px;font-size:13px;color:#475569;">This reminder was sent from the expense group admin mail on behalf of ${businessName}.</p>
                </div>
            </div>
        </body>
        </html>
    `;
};

const buildWhatsAppSettlementMessage = async (summary, groupId) => {
    const { businessName, supportEmail } = await getEmailBranding();

    const lines = appendAdminCollectionDetails(
        [
            `${businessName} Expense Share`,
            `Group: ${summary.groupName} (${groupId})`,
            ...buildSettlementSummaryMessage(summary, groupId),
        ],
        summary.adminUpiId,
        summary.adminScannerUrl,
        summary.adminDriveLink,
        summary.dueAmount,
        summary.groupName
    );

    return [...lines, '', `Support: ${supportEmail}`];
};

// Get user's expenses
router.get('/', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        await ensureExpenseSchema();
        const { groupId, month, year, page = 1, limit = 20 } = req.query;
        const userEmail = await getCurrentUserEmail(req.user.userId);

        let sql = `
            SELECT e.*, 
                   u.name as paid_by_name,
                   rg.expense_category,
                   rg.expense_status,
                   (SELECT SUM(amount) FROM expense_splits WHERE expense_id = e.id AND is_paid = TRUE) as amount_settled,
                   (SELECT SUM(amount) FROM expense_splits WHERE expense_id = e.id AND is_paid = FALSE) as amount_pending
            FROM expenses e
            JOIN users u ON e.paid_by = u.id
            LEFT JOIN roommate_groups rg ON rg.group_id = e.group_id
            WHERE ${buildExpenseAccessCondition('e')}
        `;
        const params = getAccessParams(req.user.userId, userEmail);

        if (groupId) {
            sql += ' AND e.group_id = ?';
            params.push(groupId);
        }

        if (month && year) {
            sql += ' AND MONTH(e.expense_date) = ? AND YEAR(e.expense_date) = ?';
            params.push(parseInt(month, 10), parseInt(year, 10));
        }

        sql += ' ORDER BY e.expense_date DESC LIMIT ? OFFSET ?';
        params.push(parseInt(limit, 10), (parseInt(page, 10) - 1) * parseInt(limit, 10));

        const expenses = await executeQuery(sql, params);

        for (const expense of expenses) {
            const splits = await executeQuery(
                `SELECT es.*, r.name as roommate_name, r.email as roommate_email, r.contact as roommate_contact
                 FROM expense_splits es
                 JOIN roommates r ON es.roommate_id = r.id
                 WHERE es.expense_id = ?`,
                [expense.id]
            );
            expense.splits = splits;
        }

        res.json({
            success: true,
            data: expenses,
        });
    } catch (error) {
        next(error);
    }
});

// Get expense summary/statistics
router.get('/stats/summary', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        await ensureExpenseSchema();
        const { groupId, year, month } = req.query;
        const userEmail = await getCurrentUserEmail(req.user.userId);

        let sql = `
            SELECT 
                COUNT(*) as total_expenses,
                COALESCE(SUM(cost), 0) as total_amount,
                COALESCE(SUM(CASE WHEN is_settled THEN cost ELSE 0 END), 0) as settled_amount,
                COALESCE(SUM(CASE WHEN NOT is_settled THEN cost ELSE 0 END), 0) as pending_amount
            FROM expenses
            WHERE ${buildExpenseAccessCondition()}
        `;
        const params = getAccessParams(req.user.userId, userEmail);

        if (groupId) {
            sql += ' AND group_id = ?';
            params.push(groupId);
        }

        if (year) {
            sql += ' AND YEAR(expense_date) = ?';
            params.push(parseInt(year, 10));
        }

        if (month) {
            sql += ' AND MONTH(expense_date) = ?';
            params.push(parseInt(month, 10));
        }

        const summary = await executeQuery(sql, params);

        const monthlyData = await executeQuery(
            `SELECT 
                MONTH(e.expense_date) as month,
                YEAR(e.expense_date) as year,
                COUNT(*) as expense_count,
                SUM(e.cost) as total_amount
             FROM expenses e
             WHERE ${buildExpenseAccessCondition('e')}
             GROUP BY YEAR(e.expense_date), MONTH(e.expense_date)
             ORDER BY year DESC, month DESC
             LIMIT 12`,
            getAccessParams(req.user.userId, userEmail)
        );

        const categoryData = await executeQuery(
            `SELECT 
                e.title,
                COUNT(*) as count,
                SUM(e.cost) as total
             FROM expenses e
             WHERE ${buildExpenseAccessCondition('e')}
             GROUP BY e.title
             ORDER BY total DESC
             LIMIT 10`,
            getAccessParams(req.user.userId, userEmail)
        );

        res.json({
            success: true,
            data: {
                summary: summary[0],
                monthly: monthlyData,
                byCategory: categoryData,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get('/groups/:groupId/members/:roommateId/settlement-summary', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        await ensureExpenseSchema();

        const { groupId, roommateId } = req.params;
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const hasGroupAccess = await ensureGroupAccess(groupId, req.user.userId, userEmail);
        if (!hasGroupAccess) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group',
            });
        }

        const summary = await getGroupSettlementSummary(groupId, roommateId);
        if (!summary) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in this group',
            });
        }

        const messageLines = await buildWhatsAppSettlementMessage(summary, groupId);

        res.json({
            success: true,
            data: {
                roommateId: Number(roommateId),
                name: summary.target.name,
                email: summary.target.email,
                contact: summary.target.contact,
                totalSpent: summary.totalSpent,
                totalMembers: summary.totalMembers,
                equalShare: summary.equalShare,
                alreadyPaid: summary.alreadyPaid,
                dueAmount: summary.dueAmount,
                expenseLines: summary.expenseLines,
                message: messageLines.join('\n'),
                whatsappLink: buildWhatsAppLink(summary.target.contact, messageLines.join('\n')),
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post('/groups/:groupId/members/:roommateId/remind', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        await ensureExpenseSchema();

        const { groupId, roommateId } = req.params;
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const hasGroupAccess = await ensureGroupAccess(groupId, req.user.userId, userEmail);
        if (!hasGroupAccess) {
            return res.status(403).json({
                success: false,
                message: 'You are not a member of this group',
            });
        }

        const groupRows = await executeQuery(
            'SELECT created_by FROM roommate_groups WHERE group_id = ? LIMIT 1',
            [groupId]
        );

        if (!groupRows[0] || Number(groupRows[0].created_by) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only expense group admin can send notifications',
            });
        }

        const adminUpiId = String(req.body?.adminUpiId || '').trim();
        const adminScannerUrl = String(req.body?.adminScannerUrl || '').trim();
        const adminDriveLink = String(req.body?.adminDriveLink || '').trim();

        if (adminUpiId.length > 120) {
            return res.status(400).json({
                success: false,
                message: 'Admin UPI ID is too long',
            });
        }

        if (adminScannerUrl.length > 2048) {
            return res.status(400).json({
                success: false,
                message: 'Admin scanner URL is too long',
            });
        }

        if (adminDriveLink.length > 2048) {
            return res.status(400).json({
                success: false,
                message: 'Admin drive link is too long',
            });
        }

        if (adminUpiId || adminScannerUrl || adminDriveLink) {
            await executeQuery(
                `UPDATE roommate_groups
                 SET admin_upi_id = ?, admin_scanner_url = ?, admin_drive_link = ?
                 WHERE group_id = ?`,
                [adminUpiId || null, adminScannerUrl || null, adminDriveLink || null, groupId]
            );
        }

        const summary = await getGroupSettlementSummary(groupId, roommateId);
        if (!summary) {
            return res.status(404).json({
                success: false,
                message: 'Member not found in this group',
            });
        }

        await executeQuery(
            `UPDATE expense_splits es
             JOIN expenses e ON e.id = es.expense_id
             SET es.notification_sent = TRUE, es.notification_sent_at = NOW()
             WHERE e.group_id = ?
               AND es.roommate_id = ?
               AND es.is_paid = FALSE`,
            [groupId, Number(roommateId)]
        );

        const reminderLines = appendAdminCollectionDetails(
            buildSettlementSummaryMessage(summary, groupId),
            adminUpiId || summary.adminUpiId,
            adminScannerUrl || summary.adminScannerUrl,
            adminDriveLink || summary.adminDriveLink,
            summary.dueAmount,
            summary.groupName
        );

        const effectiveUpi = adminUpiId || summary.adminUpiId || '';
        const effectiveScanner = adminScannerUrl || summary.adminScannerUrl || '';

        if (!effectiveUpi && !effectiveScanner) {
            return res.status(400).json({
                success: false,
                message: 'Please set admin UPI ID or scanner image before reminder',
            });
        }

        let emailSent = false;
        if (summary.target.email) {
            const { businessName, supportEmail } = await getEmailBranding();
            const reminderEmailLines = [...reminderLines, '', `Support: ${supportEmail}`];
            const senderRows = await executeQuery(
                'SELECT name, email FROM users WHERE id = ? LIMIT 1',
                [req.user.userId]
            );

            const senderName = senderRows[0]?.name || 'Group Admin';
            const senderEmail = senderRows[0]?.email || process.env.NOTIFICATION_EMAIL || process.env.SUPPORT_EMAIL || 'customer@support.com';

            const emailResult = await sendEmail({
                from: senderEmail,
                to: summary.target.email,
                subject: `Expense Reminder - ${summary.groupName} (${groupId})`,
                html: buildReminderEmailHtml({
                    targetName: summary.target.name,
                    groupName: summary.groupName,
                    groupId,
                    reminderLines: reminderEmailLines,
                    scannerUrl: effectiveScanner,
                    businessName,
                    supportEmail,
                }),
                text: `Hello ${summary.target.name || 'Member'},\n\n${reminderEmailLines.join('\n')}\n\nSent by: ${senderName}`,
            });

            emailSent = Boolean(emailResult?.success);
        }

        res.json({
            success: true,
            message: 'Notification prepared successfully',
            data: {
                name: summary.target.name,
                email: summary.target.email,
                contact: summary.target.contact,
                dueAmount: summary.dueAmount,
                message: [...reminderLines, '', `Support: ${(await getEmailBranding()).supportEmail}`].join('\n'),
                whatsappLink: null,
                emailSent,
            },
        });
    } catch (error) {
        next(error);
    }
});

// Get expense by ID
router.get('/:expenseId', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        await ensureExpenseSchema();
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const expenses = await executeQuery(
                        `SELECT e.*, u.name as paid_by_name, rg.expense_status
             FROM expenses e
             JOIN users u ON e.paid_by = u.id
                         LEFT JOIN roommate_groups rg ON rg.group_id = e.group_id
             WHERE e.expense_id = ?
               AND ${buildExpenseAccessCondition('e')}`,
            [req.params.expenseId, ...getAccessParams(req.user.userId, userEmail)]
        );

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        const expense = expenses[0];

        const splits = await executeQuery(
            `SELECT es.*, r.name as roommate_name, r.email as roommate_email, r.contact as roommate_contact
             FROM expense_splits es
             JOIN roommates r ON es.roommate_id = r.id
             WHERE es.expense_id = ?`,
            [expense.id]
        );
        expense.splits = splits;

        res.json({
            success: true,
            data: expense,
        });
    } catch (error) {
        next(error);
    }
});

// Create expense
router.post(
    '/',
    authenticate,
    requireMember,
    [
        body('title').trim().notEmpty(),
        body('cost').isFloat({ min: 0.01 }),
        body('expenseDate').isISO8601(),
        body('expenseCategory').optional().isIn(['Daily', 'TripOther']),
        body('paidBy').optional().isInt(),
        body('groupId').optional().trim(),
        body('splits').isArray({ min: 1 }),
        body('splitType').optional().isIn(['Equal', 'Custom']),
        body('dueDate').optional().isISO8601(),
    ],
    async (req, res, next) => {
        try {
            await ensureExpenseGroupSchema();
            await ensureExpenseSchema();
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation failed',
                    errors: errors.array(),
                });
            }

            const {
                title,
                cost,
                expenseDate,
                expenseCategory = 'Daily',
                paidBy,
                groupId,
                splits,
                dueDate,
                notes,
                splitType = 'Equal',
            } = req.body;

            const normalizedCost = Number(cost);
            const payerId = Number(paidBy || req.user.userId);
            const userEmail = await getCurrentUserEmail(req.user.userId);

            const creatorRows = await executeQuery(
                'SELECT name, email, contact FROM users WHERE id = ? LIMIT 1',
                [req.user.userId]
            );

            if (creatorRows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Creator account not found',
                });
            }

            const creator = creatorRows[0];
            let resolvedGroupId = String(groupId || '').trim() || null;

            if (!resolvedGroupId && payerId !== req.user.userId) {
                return res.status(400).json({
                    success: false,
                    message: 'In new member mode, paidBy must be the current user',
                });
            }

            if (resolvedGroupId) {
                const hasGroupAccess = await ensureGroupAccess(resolvedGroupId, req.user.userId, userEmail);

                if (!hasGroupAccess) {
                    return res.status(403).json({
                        success: false,
                        message: 'You are not a member of this group',
                    });
                }
            }

            if (splitType === 'Custom') {
                const hasInvalid = splits.some((split) => !Number.isFinite(Number(split.amount)) || Number(split.amount) <= 0);
                if (hasInvalid) {
                    return res.status(400).json({
                        success: false,
                        message: 'All custom split amounts must be greater than 0',
                    });
                }

                const customTotal = round2(
                    splits.reduce((sum, split) => sum + Number(split.amount || 0), 0)
                );

                if (Math.abs(customTotal - normalizedCost) > 0.01) {
                    return res.status(400).json({
                        success: false,
                        message: 'Custom split amount total must match expense cost',
                    });
                }
            }

            let expenseId = null;
            let isUniqueExpenseId = false;
            while (!isUniqueExpenseId) {
                const candidate = generateExpenseId();
                const existing = await executeQuery('SELECT id FROM expenses WHERE expense_id = ?', [candidate]);
                if (existing.length === 0) {
                    expenseId = candidate;
                    isUniqueExpenseId = true;
                }
            }

            await withTransaction(async (connection) => {
                const splitRows = splits.map((split) => ({
                    roommateId: split.roommateId ? Number(split.roommateId) : null,
                    name: String(split.name || '').trim(),
                    email: String(split.email || '').trim() || null,
                    contact: String(split.contact || '').trim() || null,
                    city: String(split.city || '').trim() || null,
                    amount: splitType === 'Custom' ? Number(split.amount) : null,
                }));

                let groupName = null;

                if (!resolvedGroupId) {
                    resolvedGroupId = await generateUniqueGroupId(connection);
                    groupName = `Broker Split ${resolvedGroupId}`;
                    const expenseLabel = expenseCategory === 'Daily' ? getCurrentMonthExpenseLabel() : groupName;

                    await connection.execute(
                        `INSERT INTO roommate_groups (
                            group_id, group_name, created_by, expense_category, expense_label, expense_status, allow_member_edit_history
                         ) VALUES (?, ?, ?, ?, ?, 'Ongoing', 0)`,
                        [resolvedGroupId, groupName, req.user.userId, expenseCategory, expenseLabel]
                    );

                    await connection.execute(
                        `INSERT INTO roommates (
                            user_id, linked_user_id, name, email, contact, group_id, group_name,
                            invited_by, status, accepted_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Accepted', NOW())`,
                        [
                            req.user.userId,
                            req.user.userId,
                            creator.name,
                            creator.email,
                            creator.contact || null,
                            resolvedGroupId,
                            groupName,
                            req.user.userId,
                        ]
                    );
                } else {
                    const [groupNameRows] = await connection.execute(
                        `SELECT COALESCE(rg.group_name, r.group_name, CONCAT('Group ', ?)) as group_name
                         FROM roommates r
                         LEFT JOIN roommate_groups rg ON rg.group_id = r.group_id
                         WHERE r.group_id = ?
                         LIMIT 1`,
                        [resolvedGroupId, resolvedGroupId]
                    );
                    groupName = groupNameRows[0]?.group_name || `Group ${resolvedGroupId}`;
                }

                if (payerId !== req.user.userId) {
                    const [payerRows] = await connection.execute(
                        `SELECT id
                         FROM roommates
                         WHERE group_id = ?
                           AND status = 'Accepted'
                           AND (user_id = ? OR linked_user_id = ?)
                         LIMIT 1`,
                        [resolvedGroupId, payerId, payerId]
                    );

                    if (payerRows.length === 0) {
                        throw new Error('VALIDATION: paidBy user must be an accepted member of the selected group');
                    }
                }

                for (const split of splitRows) {
                    if (split.roommateId) {
                        const [rows] = await connection.execute(
                            `SELECT id
                             FROM roommates
                             WHERE id = ? AND group_id = ? AND status = 'Accepted'
                             LIMIT 1`,
                            [split.roommateId, resolvedGroupId]
                        );

                        if (rows.length === 0) {
                            throw new Error('VALIDATION: One or more split roommate IDs are invalid for the selected group');
                        }
                        continue;
                    }

                    if (!split.name || (!split.email && !split.contact)) {
                        throw new Error('VALIDATION: Manual split entry requires name and at least email/contact');
                    }

                    let existingMember = [];
                    if (split.email) {
                        [existingMember] = await connection.execute(
                            `SELECT id
                             FROM roommates
                             WHERE group_id = ? AND LOWER(email) = LOWER(?)
                             LIMIT 1`,
                            [resolvedGroupId, split.email]
                        );
                    }

                    if (existingMember.length > 0) {
                        split.roommateId = existingMember[0].id;
                    } else {
                        let linkedUserId = null;
                        if (split.email) {
                            const [linkedUsers] = await connection.execute(
                                'SELECT id FROM users WHERE LOWER(email) = LOWER(?) LIMIT 1',
                                [split.email]
                            );
                            linkedUserId = linkedUsers[0]?.id || null;
                        }

                        const [insertResult] = await connection.execute(
                            `INSERT INTO roommates (
                                linked_user_id, name, email, contact, city,
                                group_id, group_name, invited_by, status, accepted_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Accepted', NOW())`,
                            [
                                linkedUserId,
                                split.name,
                                split.email,
                                split.contact,
                                split.city,
                                resolvedGroupId,
                                groupName,
                                req.user.userId,
                            ]
                        );

                        split.roommateId = insertResult.insertId;
                    }
                }

                const finalizedAmounts =
                    splitType === 'Equal'
                        ? calculateEqualSplitAmounts(normalizedCost, splitRows.length)
                        : splitRows.map((split) => round2(split.amount));

                const [expenseResult] = await connection.execute(
                    `INSERT INTO expenses (
                        expense_id, title, cost, expense_date, paid_by, group_id,
                        expense_category, split_type, due_date, notes, created_by, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        expenseId,
                        title,
                        normalizedCost,
                        expenseDate,
                        payerId,
                        resolvedGroupId,
                        expenseCategory,
                        splitType,
                        dueDate || null,
                        notes || null,
                        req.user.userId,
                    ]
                );

                const expenseDbId = expenseResult.insertId;
                const payerNameRows = await executeQuery('SELECT name FROM users WHERE id = ?', [payerId]);
                const payerName = payerNameRows[0]?.name || req.user.name || 'Someone';

                for (let i = 0; i < splitRows.length; i += 1) {
                    const split = splitRows[i];
                    const amount = finalizedAmounts[i];

                    await connection.execute(
                        'INSERT INTO expense_splits (expense_id, roommate_id, amount) VALUES (?, ?, ?)',
                        [expenseDbId, split.roommateId, amount]
                    );

                    const [roommateRows] = await connection.execute(
                        'SELECT name, email FROM roommates WHERE id = ? LIMIT 1',
                        [split.roommateId]
                    );

                    if (roommateRows.length > 0 && roommateRows[0].email) {
                        await sendExpenseNotificationEmail(
                            roommateRows[0].email,
                            roommateRows[0].name,
                            title,
                            amount,
                            dueDate,
                            payerName
                        );
                    }
                }
            });

            res.status(201).json({
                success: true,
                message: 'Expense created successfully',
                data: { expenseId },
            });
        } catch (error) {
            if (String(error?.message || '').startsWith('VALIDATION:')) {
                return res.status(400).json({
                    success: false,
                    message: String(error.message).replace('VALIDATION:', '').trim(),
                });
            }
            next(error);
        }
    }
);

// Update expense
router.put('/:expenseId', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const expenses = await executeQuery(
            `SELECT e.id, e.group_id, e.created_by, e.is_settled, e.cost
             FROM expenses e
             WHERE e.expense_id = ?
               AND ${buildExpenseAccessCondition('e')}`,
            [req.params.expenseId, ...getAccessParams(req.user.userId, userEmail)]
        );

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        const hasEditAccess = await canEditExpenseHistory(
            expenses[0].group_id,
            expenses[0].created_by,
            req.user.userId,
            userEmail
        );

        if (!hasEditAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to edit this expense history',
            });
        }

        if (expenses[0].is_settled) {
            return res.status(400).json({
                success: false,
                message: 'Cannot update a settled expense',
            });
        }

        const { title, cost, expenseDate, dueDate, notes, tripLabel, trip_label, splits } = req.body;
        const updates = [];
        const values = [];

        if (title) {
            updates.push('title = ?');
            values.push(title);
        }
        if (cost !== undefined) {
            const normalizedCost = Number(cost);
            if (!Number.isFinite(normalizedCost) || normalizedCost <= 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Please provide a valid amount',
                });
            }
            updates.push('cost = ?');
            values.push(normalizedCost);
        }
        if (expenseDate) {
            updates.push('expense_date = ?');
            values.push(expenseDate);
        }
        if (dueDate !== undefined) {
            updates.push('due_date = ?');
            values.push(dueDate);
        }
        if (notes !== undefined) {
            updates.push('notes = ?');
            values.push(notes);
        }
        const resolvedTripLabel = tripLabel !== undefined ? tripLabel : trip_label;
        if (resolvedTripLabel !== undefined) {
            updates.push('trip_label = ?');
            values.push(resolvedTripLabel || null);
        }

        if (updates.length === 0 && splits === undefined) {
            return res.status(400).json({
                success: false,
                message: 'No fields to update',
            });
        }

        const targetCost = Number(cost !== undefined ? cost : expenses[0].cost || 0);

        let normalizedSplits = null;
        if (splits !== undefined) {
            if (!Array.isArray(splits) || splits.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'At least one split is required',
                });
            }

            const groupMembers = await executeQuery(
                `SELECT id
                 FROM roommates
                 WHERE group_id = ? AND status = 'Accepted'`,
                [expenses[0].group_id]
            );
            const validMemberIds = new Set(groupMembers.map((member) => Number(member.id)));

            normalizedSplits = splits.map((split) => ({
                splitId: split.splitId ? Number(split.splitId) : null,
                roommateId: Number(split.roommateId),
                amount: Number(split.amount),
            }));

            const invalidSplit = normalizedSplits.some((split) => (
                !Number.isInteger(split.roommateId)
                || split.roommateId <= 0
                || !validMemberIds.has(split.roommateId)
                || !Number.isFinite(split.amount)
                || split.amount <= 0
            ));

            if (invalidSplit) {
                return res.status(400).json({
                    success: false,
                    message: 'Split members or amounts are invalid',
                });
            }

            const splitTotal = round2(normalizedSplits.reduce((sum, split) => sum + split.amount, 0));
            if (Math.abs(splitTotal - round2(targetCost)) > 0.01) {
                return res.status(400).json({
                    success: false,
                    message: 'Split total must match amount',
                });
            }

            const existingSplits = await executeQuery(
                'SELECT id, roommate_id, is_paid FROM expense_splits WHERE expense_id = ?',
                [expenses[0].id]
            );

            const hasPaidSplit = existingSplits.some((split) => Boolean(split.is_paid));
            if (hasPaidSplit) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change split members after any split is paid',
                });
            }

            const existingSplitIds = new Set(existingSplits.map((split) => Number(split.id)));
            const duplicateMembers = new Set();
            for (const split of normalizedSplits) {
                if (duplicateMembers.has(split.roommateId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Duplicate split member selected',
                    });
                }
                duplicateMembers.add(split.roommateId);

                if (split.splitId !== null && !existingSplitIds.has(split.splitId)) {
                    return res.status(400).json({
                        success: false,
                        message: 'Invalid split reference',
                    });
                }
            }
        }

        await withTransaction(async (connection) => {
            if (updates.length > 0) {
                await connection.execute(
                    `UPDATE expenses SET ${updates.join(', ')} WHERE id = ?`,
                    [...values, expenses[0].id]
                );
            }

            if (normalizedSplits) {
                const [existingRows] = await connection.execute(
                    'SELECT id, roommate_id FROM expense_splits WHERE expense_id = ?',
                    [expenses[0].id]
                );

                const keepSplitIds = new Set();
                for (const split of normalizedSplits) {
                    if (split.splitId !== null) {
                        keepSplitIds.add(split.splitId);
                        await connection.execute(
                            'UPDATE expense_splits SET roommate_id = ?, amount = ? WHERE id = ? AND expense_id = ?',
                            [split.roommateId, split.amount, split.splitId, expenses[0].id]
                        );
                    } else {
                        const [insertResult] = await connection.execute(
                            'INSERT INTO expense_splits (expense_id, roommate_id, amount, is_paid, notification_sent) VALUES (?, ?, ?, FALSE, FALSE)',
                            [expenses[0].id, split.roommateId, split.amount]
                        );
                        keepSplitIds.add(Number(insertResult.insertId));
                    }
                }

                const toDelete = existingRows
                    .map((row) => Number(row.id))
                    .filter((id) => !keepSplitIds.has(id));

                if (toDelete.length > 0) {
                    await connection.execute(
                        `DELETE FROM expense_splits
                         WHERE expense_id = ?
                           AND id IN (${toDelete.map(() => '?').join(', ')})`,
                        [expenses[0].id, ...toDelete]
                    );
                }
            }
        });

        res.json({
            success: true,
            message: 'Expense updated successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Delete expense
router.delete('/:expenseId', authenticate, requireMember, async (req, res, next) => {
    try {
        await ensureExpenseGroupSchema();
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const expenses = await executeQuery(
            `SELECT e.id, e.group_id, e.created_by, e.is_settled
             FROM expenses e
             WHERE e.expense_id = ?
               AND ${buildExpenseAccessCondition('e')}`,
            [req.params.expenseId, ...getAccessParams(req.user.userId, userEmail)]
        );

        if (expenses.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        const hasEditAccess = await canEditExpenseHistory(
            expenses[0].group_id,
            expenses[0].created_by,
            req.user.userId,
            userEmail
        );

        if (!hasEditAccess) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this expense history',
            });
        }

        if (expenses[0].is_settled) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete a settled expense',
            });
        }

        await executeQuery('DELETE FROM expenses WHERE id = ?', [expenses[0].id]);

        res.json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Mark split as paid
router.put('/:expenseId/splits/:splitId/pay', authenticate, requireMember, async (req, res, next) => {
    try {
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const expenseRows = await executeQuery(
                        `SELECT e.id, rg.created_by
             FROM expenses e
                         LEFT JOIN roommate_groups rg ON rg.group_id = e.group_id
             WHERE e.expense_id = ?
               AND ${buildExpenseAccessCondition('e')}`,
            [req.params.expenseId, ...getAccessParams(req.user.userId, userEmail)]
        );

        if (expenseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        if (Number(expenseRows[0].created_by) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only expense group admin can mark payments as paid',
            });
        }

        const splitRows = await executeQuery(
            'SELECT id FROM expense_splits WHERE id = ? AND expense_id = ? LIMIT 1',
            [req.params.splitId, expenseRows[0].id]
        );

        if (splitRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Split not found',
            });
        }

        await executeQuery(
            `UPDATE expense_splits 
             SET is_paid = TRUE, paid_at = NOW() 
             WHERE id = ?`,
            [req.params.splitId]
        );

        const pendingSplits = await executeQuery(
            `SELECT COUNT(*) as count 
             FROM expense_splits 
             WHERE expense_id = ? AND is_paid = FALSE`,
            [expenseRows[0].id]
        );

        if (pendingSplits[0].count === 0) {
            await executeQuery(
                'UPDATE expenses SET is_settled = TRUE, settled_at = NOW() WHERE id = ?',
                [expenseRows[0].id]
            );
        }

        res.json({
            success: true,
            message: 'Payment recorded successfully',
        });
    } catch (error) {
        next(error);
    }
});

router.put('/:expenseId/status', authenticate, requireMember, async (req, res, next) => {
    try {
        const userEmail = await getCurrentUserEmail(req.user.userId);
        const { isSettled } = req.body;

        if (typeof isSettled !== 'boolean') {
            return res.status(400).json({
                success: false,
                message: 'isSettled must be true or false',
            });
        }

        const expenseRows = await executeQuery(
            `SELECT e.id, rg.created_by
             FROM expenses e
             LEFT JOIN roommate_groups rg ON rg.group_id = e.group_id
             WHERE e.expense_id = ?
               AND ${buildExpenseAccessCondition('e')}`,
            [req.params.expenseId, ...getAccessParams(req.user.userId, userEmail)]
        );

        if (expenseRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Expense not found',
            });
        }

        if (Number(expenseRows[0].created_by) !== Number(req.user.userId)) {
            return res.status(403).json({
                success: false,
                message: 'Only expense group admin can close or reopen expense',
            });
        }

        await executeQuery(
            `UPDATE expenses
             SET is_settled = ?, settled_at = ?
             WHERE id = ?`,
            [isSettled ? 1 : 0, isSettled ? new Date() : null, expenseRows[0].id]
        );

        res.json({
            success: true,
            message: isSettled ? 'Expense closed successfully' : 'Expense reopened successfully',
        });
    } catch (error) {
        next(error);
    }
});

// Send payment reminder
router.post('/:expenseId/remind', authenticate, requireMember, async (req, res, next) => {
    try {
        const { splitId } = req.body;
        const userEmail = await getCurrentUserEmail(req.user.userId);

        const splits = await executeQuery(
            `SELECT es.*, e.title as expense_title, e.cost, e.due_date, r.name, r.email, r.contact
             FROM expense_splits es
             JOIN expenses e ON es.expense_id = e.id
             JOIN roommates r ON es.roommate_id = r.id
             WHERE es.id = ?
               AND e.expense_id = ?
               AND es.is_paid = FALSE
               AND ${buildExpenseAccessCondition('e')}`,
            [splitId, req.params.expenseId, ...getAccessParams(req.user.userId, userEmail)]
        );

        if (splits.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Split not found or already paid',
            });
        }

        const split = splits[0];

        await executeQuery(
            'UPDATE expense_splits SET notification_sent = TRUE, notification_sent_at = NOW() WHERE id = ?',
            [splitId]
        );

        const dueAmount = round2(split.amount).toFixed(2);
        const reminderMessage = [
            `Hi ${split.name || 'there'},`,
            `This is a reminder for shared expense \"${split.expense_title}\".`,
            `Your pending share is Rs ${dueAmount}.`,
            split.due_date ? `Due date: ${new Date(split.due_date).toLocaleDateString('en-IN')}.` : null,
            'Please settle when possible. Thanks.',
        ]
            .filter(Boolean)
            .join(' ');

        res.json({
            success: true,
            message: 'Reminder sent successfully',
            data: {
                name: split.name,
                email: split.email,
                contact: split.contact,
                whatsappLink: buildWhatsAppLink(split.contact, reminderMessage),
                whatsappMessage: reminderMessage,
            },
        });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
