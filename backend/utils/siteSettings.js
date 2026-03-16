const fs = require('fs');
const path = require('path');
const { executeQuery } = require('../config/database');

const BACKEND_ROOT = path.resolve(__dirname, '..');
const PROJECT_ROOT = path.resolve(BACKEND_ROOT, '..');
const BACKEND_ENV_PATH = path.join(BACKEND_ROOT, '.env');
const FRONTEND_PUBLIC_DIR = path.join(PROJECT_ROOT, 'public');
const FRONTEND_UPLOADS_SITES_DIR = path.join(FRONTEND_PUBLIC_DIR, 'uploads', 'sites');
const BACKEND_UPLOADS_SITES_DIR = path.join(BACKEND_ROOT, 'uploads', 'sites');
const SETTINGS_FALLBACK_FILE = path.join(FRONTEND_PUBLIC_DIR, 'site-settings.fallback.json');

const DEFAULT_SITE_SETTINGS = {
    businessName: process.env.APP_NAME || 'RoomRental',
    businessTagline: process.env.BUSINESS_TAGLINE || 'Find Your Perfect Roommate',
    supportEmail: process.env.SUPPORT_EMAIL || 'customer@support.com',
    adminEmail: process.env.ADMIN_EMAIL || process.env.SUPPORT_EMAIL || 'admin@roomrental.com',
    supportPhone: process.env.SUPPORT_PHONE || '+91 99999 99999',
    logoUrl: process.env.BUSINESS_LOGO_URL || '',
    faviconUrl: process.env.FAVICON_URL || '',
    supportAddress: process.env.BUSINESS_ADDRESS || 'Pune, Maharashtra',
    facebookUrl: process.env.FACEBOOK_URL || '',
    twitterUrl: process.env.TWITTER_URL || '',
    instagramUrl: process.env.INSTAGRAM_URL || '',
    linkedinUrl: process.env.LINKEDIN_URL || '',
    youtubeUrl: process.env.YOUTUBE_URL || '',
    defaultAdBgSearchUrl: process.env.DEFAULT_AD_BG_SEARCH_URL || '',
    defaultAdBgPostUrl: process.env.DEFAULT_AD_BG_POST_URL || ''
};

const SITE_SETTINGS_ENV_MAP = {
    businessName: 'APP_NAME',
    businessTagline: 'BUSINESS_TAGLINE',
    supportEmail: 'SUPPORT_EMAIL',
    adminEmail: 'ADMIN_EMAIL',
    supportPhone: 'SUPPORT_PHONE',
    logoUrl: 'BUSINESS_LOGO_URL',
    faviconUrl: 'FAVICON_URL',
    supportAddress: 'BUSINESS_ADDRESS',
    facebookUrl: 'FACEBOOK_URL',
    twitterUrl: 'TWITTER_URL',
    instagramUrl: 'INSTAGRAM_URL',
    linkedinUrl: 'LINKEDIN_URL',
    youtubeUrl: 'YOUTUBE_URL',
    defaultAdBgSearchUrl: 'DEFAULT_AD_BG_SEARCH_URL',
    defaultAdBgPostUrl: 'DEFAULT_AD_BG_POST_URL'
};

let hasEnsuredSiteSettingsTable = false;

const decodeHtmlEntities = (value = '') => {
    if (typeof value !== 'string') return value;

    return value
        .replace(/&amp;/g, '&')
        .replace(/&#x2F;/gi, '/')
        .replace(/&#47;/g, '/')
        .replace(/&#x3A;/gi, ':')
        .replace(/&#58;/g, ':')
        .replace(/&#x3F;/gi, '?')
        .replace(/&#63;/g, '?')
        .replace(/&#x3D;/gi, '=')
        .replace(/&#61;/g, '=');
};

const cleanSettingValue = (value = '') => decodeHtmlEntities(String(value)).trim();

const normalizeSettings = (settings = {}) => ({
    businessName: cleanSettingValue(settings.businessName ?? DEFAULT_SITE_SETTINGS.businessName),
    businessTagline: cleanSettingValue(settings.businessTagline ?? DEFAULT_SITE_SETTINGS.businessTagline),
    supportEmail: cleanSettingValue(settings.supportEmail ?? DEFAULT_SITE_SETTINGS.supportEmail),
    adminEmail: cleanSettingValue(settings.adminEmail ?? DEFAULT_SITE_SETTINGS.adminEmail),
    supportPhone: cleanSettingValue(settings.supportPhone ?? DEFAULT_SITE_SETTINGS.supportPhone),
    logoUrl: cleanSettingValue(settings.logoUrl ?? DEFAULT_SITE_SETTINGS.logoUrl),
    faviconUrl: cleanSettingValue(settings.faviconUrl ?? DEFAULT_SITE_SETTINGS.faviconUrl),
    supportAddress: cleanSettingValue(settings.supportAddress ?? DEFAULT_SITE_SETTINGS.supportAddress),
    facebookUrl: cleanSettingValue(settings.facebookUrl ?? DEFAULT_SITE_SETTINGS.facebookUrl),
    twitterUrl: cleanSettingValue(settings.twitterUrl ?? DEFAULT_SITE_SETTINGS.twitterUrl),
    instagramUrl: cleanSettingValue(settings.instagramUrl ?? DEFAULT_SITE_SETTINGS.instagramUrl),
    linkedinUrl: cleanSettingValue(settings.linkedinUrl ?? DEFAULT_SITE_SETTINGS.linkedinUrl),
    youtubeUrl: cleanSettingValue(settings.youtubeUrl ?? DEFAULT_SITE_SETTINGS.youtubeUrl),
    defaultAdBgSearchUrl: cleanSettingValue(settings.defaultAdBgSearchUrl ?? DEFAULT_SITE_SETTINGS.defaultAdBgSearchUrl),
    defaultAdBgPostUrl: cleanSettingValue(settings.defaultAdBgPostUrl ?? DEFAULT_SITE_SETTINGS.defaultAdBgPostUrl)
});

const toLocalUploadsUrl = (url = '') => {
    const cleaned = cleanSettingValue(url);
    if (!cleaned) return '';

    if (cleaned.startsWith('/uploads/sites/')) {
        return cleaned;
    }

    try {
        const parsed = new URL(cleaned);
        if (parsed.pathname.startsWith('/uploads/sites/')) {
            return parsed.pathname;
        }
    } catch {
        return cleaned;
    }

    return cleaned;
};

const ensureDir = (dirPath) => {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
    }
};

const formatEnvValue = (value = '') => {
    const normalized = String(value ?? '').replace(/\r?\n/g, ' ').trim();
    const escaped = normalized.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
    return `"${escaped}"`;
};

const upsertEnvVariables = (settings) => {
    const nextSettings = normalizeSettings(settings);
    const existingContent = fs.existsSync(BACKEND_ENV_PATH)
        ? fs.readFileSync(BACKEND_ENV_PATH, 'utf8')
        : '';

    const lines = existingContent.split(/\r?\n/);

    for (const [settingKey, envKey] of Object.entries(SITE_SETTINGS_ENV_MAP)) {
        const lineValue = `${envKey}=${formatEnvValue(nextSettings[settingKey] || '')}`;
        const index = lines.findIndex((line) => line.startsWith(`${envKey}=`));
        if (index >= 0) {
            lines[index] = lineValue;
        } else {
            lines.push(lineValue);
        }
    }

    const nextContent = `${lines.join('\n').replace(/\n{3,}/g, '\n\n')}\n`;
    fs.writeFileSync(BACKEND_ENV_PATH, nextContent, 'utf8');
};

const mirrorAssetToFrontendPublic = (url = '') => {
    const relativeUploadsPath = toLocalUploadsUrl(url);
    if (!relativeUploadsPath.startsWith('/uploads/sites/')) {
        return;
    }

    const filename = path.basename(relativeUploadsPath);
    const backendAssetPath = path.join(BACKEND_UPLOADS_SITES_DIR, filename);
    if (!fs.existsSync(backendAssetPath)) {
        return;
    }

    ensureDir(FRONTEND_UPLOADS_SITES_DIR);
    const frontendAssetPath = path.join(FRONTEND_UPLOADS_SITES_DIR, filename);
    fs.copyFileSync(backendAssetPath, frontendAssetPath);
};

const writeFallbackSettingsFile = (settings) => {
    ensureDir(FRONTEND_PUBLIC_DIR);
    const normalized = normalizeSettings(settings);

    mirrorAssetToFrontendPublic(normalized.logoUrl);
    mirrorAssetToFrontendPublic(normalized.faviconUrl);

    const fallbackData = {
        ...normalized,
        logoUrl: toLocalUploadsUrl(normalized.logoUrl),
        faviconUrl: toLocalUploadsUrl(normalized.faviconUrl),
        updatedAt: new Date().toISOString()
    };

    fs.writeFileSync(SETTINGS_FALLBACK_FILE, `${JSON.stringify(fallbackData, null, 2)}\n`, 'utf8');
};

const readFallbackSettingsFile = () => {
    if (!fs.existsSync(SETTINGS_FALLBACK_FILE)) {
        return null;
    }

    try {
        const raw = fs.readFileSync(SETTINGS_FALLBACK_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        return normalizeSettings(parsed || {});
    } catch (error) {
        console.warn('Failed to parse site settings fallback file:', error.message);
        return null;
    }
};

const persistSettingsLocally = (settings) => {
    const normalized = normalizeSettings(settings);
    writeFallbackSettingsFile(normalized);
    upsertEnvVariables(normalized);
    return normalized;
};

const mapRowToSettings = (row) => normalizeSettings({
    businessName: row?.business_name,
    businessTagline: row?.business_tagline,
    supportEmail: row?.support_email,
    adminEmail: row?.admin_email,
    supportPhone: row?.support_phone,
    logoUrl: row?.logo_url,
    faviconUrl: row?.favicon_url,
    supportAddress: row?.support_address,
    facebookUrl: row?.facebook_url,
    twitterUrl: row?.twitter_url,
    instagramUrl: row?.instagram_url,
    linkedinUrl: row?.linkedin_url,
    youtubeUrl: row?.youtube_url,
    defaultAdBgSearchUrl: row?.default_ad_bg_search_url,
    defaultAdBgPostUrl: row?.default_ad_bg_post_url
});

const ensureSiteSettingsTable = async () => {
    if (hasEnsuredSiteSettingsTable) {
        return;
    }

    await executeQuery(`
        CREATE TABLE IF NOT EXISTS site_settings (
            id TINYINT PRIMARY KEY,
            business_name VARCHAR(120) NOT NULL,
            business_tagline VARCHAR(255) NULL,
            support_email VARCHAR(160) NOT NULL,
            admin_email VARCHAR(160) NOT NULL,
            support_phone VARCHAR(40) NOT NULL,
            logo_url VARCHAR(600) NULL,
            favicon_url VARCHAR(600) NULL,
            support_address VARCHAR(255) NULL,
            facebook_url VARCHAR(500) NULL,
            twitter_url VARCHAR(500) NULL,
            instagram_url VARCHAR(500) NULL,
            linkedin_url VARCHAR(500) NULL,
            youtube_url VARCHAR(500) NULL,
            default_ad_bg_search_url VARCHAR(600) NULL,
            default_ad_bg_post_url VARCHAR(600) NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const taglineCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'business_tagline'`);
    if (!taglineCol || taglineCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN business_tagline VARCHAR(255) NULL`);
    }

    const faviconCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'favicon_url'`);
    if (!faviconCol || faviconCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN favicon_url VARCHAR(600) NULL`);
    }

    const facebookCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'facebook_url'`);
    if (!facebookCol || facebookCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN facebook_url VARCHAR(500) NULL`);
    }

    const twitterCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'twitter_url'`);
    if (!twitterCol || twitterCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN twitter_url VARCHAR(500) NULL`);
    }

    const instagramCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'instagram_url'`);
    if (!instagramCol || instagramCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN instagram_url VARCHAR(500) NULL`);
    }

    const linkedinCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'linkedin_url'`);
    if (!linkedinCol || linkedinCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN linkedin_url VARCHAR(500) NULL`);
    }

    const youtubeCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'youtube_url'`);
    if (!youtubeCol || youtubeCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN youtube_url VARCHAR(500) NULL`);
    }

    const defaultSearchBgCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'default_ad_bg_search_url'`);
    if (!defaultSearchBgCol || defaultSearchBgCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN default_ad_bg_search_url VARCHAR(600) NULL`);
    }

    const defaultPostBgCol = await executeQuery(`SHOW COLUMNS FROM site_settings LIKE 'default_ad_bg_post_url'`);
    if (!defaultPostBgCol || defaultPostBgCol.length === 0) {
        await executeQuery(`ALTER TABLE site_settings ADD COLUMN default_ad_bg_post_url VARCHAR(600) NULL`);
    }

    hasEnsuredSiteSettingsTable = true;
};

const ensureSettingsSeeded = async () => {
    await ensureSiteSettingsTable();

    const rows = await executeQuery('SELECT id FROM site_settings WHERE id = 1 LIMIT 1');
    if (!rows || rows.length === 0) {
        await executeQuery(
            `INSERT INTO site_settings (id, business_name, business_tagline, support_email, admin_email, support_phone, logo_url, favicon_url, support_address, facebook_url, twitter_url, instagram_url, linkedin_url, youtube_url, default_ad_bg_search_url, default_ad_bg_post_url)
             VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                DEFAULT_SITE_SETTINGS.businessName,
                DEFAULT_SITE_SETTINGS.businessTagline,
                DEFAULT_SITE_SETTINGS.supportEmail,
                DEFAULT_SITE_SETTINGS.adminEmail,
                DEFAULT_SITE_SETTINGS.supportPhone,
                DEFAULT_SITE_SETTINGS.logoUrl,
                DEFAULT_SITE_SETTINGS.faviconUrl,
                DEFAULT_SITE_SETTINGS.supportAddress,
                DEFAULT_SITE_SETTINGS.facebookUrl,
                DEFAULT_SITE_SETTINGS.twitterUrl,
                DEFAULT_SITE_SETTINGS.instagramUrl,
                DEFAULT_SITE_SETTINGS.linkedinUrl,
                DEFAULT_SITE_SETTINGS.youtubeUrl,
                DEFAULT_SITE_SETTINGS.defaultAdBgSearchUrl,
                DEFAULT_SITE_SETTINGS.defaultAdBgPostUrl
            ]
        );
    }
};

const getSiteSettings = async () => {
    try {
        await ensureSettingsSeeded();

        const rows = await executeQuery(
            `SELECT business_name, business_tagline, support_email, admin_email, support_phone, logo_url, favicon_url, support_address, facebook_url, twitter_url, instagram_url, linkedin_url, youtube_url, default_ad_bg_search_url, default_ad_bg_post_url
             FROM site_settings
             WHERE id = 1
             LIMIT 1`
        );

        const resolved = mapRowToSettings(rows?.[0]);
        return persistSettingsLocally(resolved);
    } catch (error) {
        console.warn('Falling back to local site settings file/env:', error.message);
        const fileFallback = readFallbackSettingsFile();
        const fallback = fileFallback || DEFAULT_SITE_SETTINGS;
        return persistSettingsLocally(fallback);
    }
};

const updateSiteSettings = async (payload = {}) => {
    const current = await getSiteSettings();

    const nextSettings = normalizeSettings({
        businessName: payload.businessName ?? current.businessName,
        businessTagline: payload.businessTagline ?? current.businessTagline,
        supportEmail: payload.supportEmail ?? current.supportEmail,
        adminEmail: payload.adminEmail ?? current.adminEmail,
        supportPhone: payload.supportPhone ?? current.supportPhone,
        logoUrl: payload.logoUrl ?? current.logoUrl,
        faviconUrl: payload.faviconUrl ?? current.faviconUrl,
        supportAddress: payload.supportAddress ?? current.supportAddress,
        facebookUrl: payload.facebookUrl ?? current.facebookUrl,
        twitterUrl: payload.twitterUrl ?? current.twitterUrl,
        instagramUrl: payload.instagramUrl ?? current.instagramUrl,
        linkedinUrl: payload.linkedinUrl ?? current.linkedinUrl,
        youtubeUrl: payload.youtubeUrl ?? current.youtubeUrl,
        defaultAdBgSearchUrl: payload.defaultAdBgSearchUrl ?? current.defaultAdBgSearchUrl,
        defaultAdBgPostUrl: payload.defaultAdBgPostUrl ?? current.defaultAdBgPostUrl
    });

    try {
        await executeQuery(
            `UPDATE site_settings
             SET business_name = ?, business_tagline = ?, support_email = ?, admin_email = ?, support_phone = ?, logo_url = ?, favicon_url = ?, support_address = ?, facebook_url = ?, twitter_url = ?, instagram_url = ?, linkedin_url = ?, youtube_url = ?, default_ad_bg_search_url = ?, default_ad_bg_post_url = ?
             WHERE id = 1`,
            [
                nextSettings.businessName,
                nextSettings.businessTagline,
                nextSettings.supportEmail,
                nextSettings.adminEmail,
                nextSettings.supportPhone,
                nextSettings.logoUrl,
                nextSettings.faviconUrl,
                nextSettings.supportAddress,
                nextSettings.facebookUrl,
                nextSettings.twitterUrl,
                nextSettings.instagramUrl,
                nextSettings.linkedinUrl,
                nextSettings.youtubeUrl,
                nextSettings.defaultAdBgSearchUrl,
                nextSettings.defaultAdBgPostUrl
            ]
        );
    } catch (error) {
        console.warn('Failed to write site settings to DB. Keeping local fallback updated:', error.message);
    }

    return persistSettingsLocally(nextSettings);
};

module.exports = {
    DEFAULT_SITE_SETTINGS,
    getSiteSettings,
    updateSiteSettings
};
