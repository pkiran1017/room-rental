const { executeQuery } = require('../config/database');

let hasVerifiedContactLeadsTable = false;

const CONTACT_LEAD_STATUSES = ['New', 'In Progress', 'Closed', 'Spam'];

const getRequestIp = (req) => {
    const forwardedFor = req.headers['x-forwarded-for'];

    if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
        return forwardedFor.split(',')[0].trim().slice(0, 45);
    }

    return String(req.ip || req.socket?.remoteAddress || '').trim().slice(0, 45) || null;
};

const stripTags = (value) => String(value || '').replace(/<[^>]*>/g, ' ');

const normalizeWhitespace = (value) => String(value || '').replace(/\s+/g, ' ').trim();

const normalizeContactLeadPayload = (payload = {}) => ({
    name: normalizeWhitespace(stripTags(payload.name)).slice(0, 100),
    email: normalizeWhitespace(payload.email).toLowerCase().slice(0, 150),
    phone: normalizeWhitespace(payload.phone).slice(0, 20),
    subject: normalizeWhitespace(stripTags(payload.subject)).slice(0, 200),
    message: normalizeWhitespace(stripTags(payload.message)).slice(0, 4000),
    sourcePage: normalizeWhitespace(payload.sourcePage).slice(0, 120),
    website: normalizeWhitespace(payload.website).slice(0, 255),
    formElapsedMs: Number.isFinite(Number(payload.formElapsedMs)) ? Number(payload.formElapsedMs) : null
});

const escapeLikeSearchTerm = (value) => String(value || '').replace(/[\\%_]/g, '\\$&');

const computeSpamAssessment = ({ name, email, subject, message, website, formElapsedMs }) => {
    const reasons = [];
    let score = 0;
    const fullText = `${name} ${email} ${subject} ${message}`.toLowerCase();
    const linkMatches = fullText.match(/(https?:\/\/|www\.)/g) || [];

    if (website) {
        reasons.push('honeypot field was filled');
        score += 100;
    }

    if (typeof formElapsedMs === 'number' && formElapsedMs >= 0 && formElapsedMs < 3000) {
        reasons.push('form submitted too quickly');
        score += 45;
    }

    if (linkMatches.length >= 1) {
        reasons.push('contains external links');
        score += linkMatches.length >= 2 ? 35 : 20;
    }

    if (/<[a-z][\s\S]*>/i.test(message)) {
        reasons.push('contains html markup');
        score += 25;
    }

    if (/(casino|viagra|loan approval|crypto|mining|seo service|backlink|telegram|whatsapp group|betting|forex|escort)/i.test(fullText)) {
        reasons.push('matched spam keywords');
        score += 60;
    }

    if (/(.)\1{6,}/.test(fullText)) {
        reasons.push('contains repeated characters');
        score += 20;
    }

    if (message.length > 0 && message.length < 20) {
        reasons.push('message too short');
        score += 15;
    }

    const uppercaseLetters = message.replace(/[^A-Z]/g, '').length;
    const alphaLetters = message.replace(/[^A-Za-z]/g, '').length;
    if (alphaLetters > 12 && uppercaseLetters / alphaLetters > 0.7) {
        reasons.push('message uses excessive uppercase text');
        score += 15;
    }

    return {
        score,
        reasons,
        isSpam: score >= 50
    };
};

const ensureContactLeadsTable = async () => {
    if (hasVerifiedContactLeadsTable) {
        return;
    }

    await executeQuery(`
        CREATE TABLE IF NOT EXISTS contact_leads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(150) NOT NULL,
            phone VARCHAR(20) NULL,
            subject VARCHAR(200) NOT NULL,
            message TEXT NOT NULL,
            source_page VARCHAR(120) NULL,
            status ENUM('New', 'In Progress', 'Closed', 'Spam') NOT NULL DEFAULT 'New',
            admin_remark TEXT NULL,
            is_spam BOOLEAN NOT NULL DEFAULT FALSE,
            spam_score INT NOT NULL DEFAULT 0,
            spam_reason VARCHAR(255) NULL,
            ip_address VARCHAR(45) NULL,
            user_agent VARCHAR(255) NULL,
            reviewed_by INT NULL,
            reviewed_at TIMESTAMP NULL,
            submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_contact_leads_status (status),
            INDEX idx_contact_leads_email (email),
            INDEX idx_contact_leads_spam (is_spam),
            INDEX idx_contact_leads_submitted_at (submitted_at),
            CONSTRAINT fk_contact_leads_reviewed_by FOREIGN KEY (reviewed_by) REFERENCES users(id) ON DELETE SET NULL
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const optionalColumns = [
        {
            name: 'source_page',
            definition: "ALTER TABLE contact_leads ADD COLUMN source_page VARCHAR(120) NULL AFTER message"
        },
        {
            name: 'status',
            definition: "ALTER TABLE contact_leads ADD COLUMN status ENUM('New', 'In Progress', 'Closed', 'Spam') NOT NULL DEFAULT 'New' AFTER source_page"
        },
        {
            name: 'admin_remark',
            definition: 'ALTER TABLE contact_leads ADD COLUMN admin_remark TEXT NULL AFTER status'
        },
        {
            name: 'is_spam',
            definition: 'ALTER TABLE contact_leads ADD COLUMN is_spam BOOLEAN NOT NULL DEFAULT FALSE AFTER admin_remark'
        },
        {
            name: 'spam_score',
            definition: 'ALTER TABLE contact_leads ADD COLUMN spam_score INT NOT NULL DEFAULT 0 AFTER is_spam'
        },
        {
            name: 'spam_reason',
            definition: 'ALTER TABLE contact_leads ADD COLUMN spam_reason VARCHAR(255) NULL AFTER spam_score'
        },
        {
            name: 'ip_address',
            definition: 'ALTER TABLE contact_leads ADD COLUMN ip_address VARCHAR(45) NULL AFTER spam_reason'
        },
        {
            name: 'user_agent',
            definition: 'ALTER TABLE contact_leads ADD COLUMN user_agent VARCHAR(255) NULL AFTER ip_address'
        },
        {
            name: 'reviewed_by',
            definition: 'ALTER TABLE contact_leads ADD COLUMN reviewed_by INT NULL AFTER user_agent'
        },
        {
            name: 'reviewed_at',
            definition: 'ALTER TABLE contact_leads ADD COLUMN reviewed_at TIMESTAMP NULL AFTER reviewed_by'
        },
        {
            name: 'submitted_at',
            definition: 'ALTER TABLE contact_leads ADD COLUMN submitted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP AFTER reviewed_at'
        },
        {
            name: 'updated_at',
            definition: 'ALTER TABLE contact_leads ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER submitted_at'
        }
    ];

    for (const column of optionalColumns) {
        const result = await executeQuery(`SHOW COLUMNS FROM contact_leads LIKE '${column.name}'`);
        if (!result || result.length === 0) {
            await executeQuery(column.definition);
        }
    }

    hasVerifiedContactLeadsTable = true;
};

module.exports = {
    CONTACT_LEAD_STATUSES,
    computeSpamAssessment,
    ensureContactLeadsTable,
    escapeLikeSearchTerm,
    getRequestIp,
    normalizeContactLeadPayload
};