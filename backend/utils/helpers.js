// Generate unique ID with format: P + 4 digits + R (e.g., P1144R)
const generateUserId = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `P${random}R`;
};

// Generate room ID with format: R + 4 digits + N (e.g., R0414N)
const generateRoomId = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `R${random}N`;
};

// Generate expense ID with format: E + 4 digits + X (e.g., E1234X)
const generateExpenseId = () => {
    const random = Math.floor(1000 + Math.random() * 9000);
    return `E${random}X`;
};

// Generate 5-character alphanumeric group ID
const generateGroupId = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 5; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
};

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate invite token
const generateInviteToken = () => {
    return require('crypto').randomBytes(32).toString('hex');
};

// Format date
const formatDate = (date, format = 'YYYY-MM-DD') => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    
    return format
        .replace('YYYY', year)
        .replace('MM', month)
        .replace('DD', day);
};

// Format currency
const formatCurrency = (amount, currency = 'INR') => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: currency
    }).format(amount);
};

// Calculate distance between two coordinates (Haversine formula)
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Earth's radius in kilometers
    const dLat = toRadians(lat2 - lat1);
    const dLon = toRadians(lon2 - lon1);
    
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
              Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
              Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
};

const toRadians = (degrees) => {
    return degrees * (Math.PI / 180);
};

// Sanitize string for SQL
const sanitizeString = (str) => {
    if (!str) return '';
    return str.replace(/[\\'"\n\r\t\x00\x1a]/g, '\\$&');
};

// Validate email
const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// Validate phone number (Indian format)
const isValidPhone = (phone) => {
    const phoneRegex = /^[6-9]\d{9}$/;
    return phoneRegex.test(phone);
};

// Validate PIN code
const isValidPincode = (pincode) => {
    const pincodeRegex = /^\d{6}$/;
    return pincodeRegex.test(pincode);
};

// Paginate results
const paginate = (items, page = 1, limit = 10) => {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return {
        data: items.slice(startIndex, endIndex),
        pagination: {
            currentPage: page,
            totalPages: Math.ceil(items.length / limit),
            totalItems: items.length,
            itemsPerPage: limit,
            hasNextPage: endIndex < items.length,
            hasPrevPage: startIndex > 0
        }
    };
};

// Create SEO-friendly slug
const createSlug = (text) => {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
};

// Generate meta tags for SEO
const generateMetaTags = (data) => {
    const defaults = {
        title: 'RoomRental - Find Your Perfect Room',
        description: 'Find rooms for rent, roommates, and properties for sale. Best platform for room rentals in Maharashtra.',
        image: '/default-og-image.jpg',
        url: process.env.SITE_URL || 'https://yourdomain.com'
    };

    const meta = { ...defaults, ...data };

    return {
        title: meta.title,
        meta: [
            { name: 'description', content: meta.description },
            { property: 'og:title', content: meta.title },
            { property: 'og:description', content: meta.description },
            { property: 'og:image', content: meta.image },
            { property: 'og:url', content: meta.url },
            { property: 'og:type', content: 'website' },
            { name: 'twitter:card', content: 'summary_large_image' },
            { name: 'twitter:title', content: meta.title },
            { name: 'twitter:description', content: meta.description },
            { name: 'twitter:image', content: meta.image }
        ]
    };
};

// Deep clone object
const deepClone = (obj) => {
    return JSON.parse(JSON.stringify(obj));
};

// Debounce function
const debounce = (func, wait) => {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
};

// Throttle function
const throttle = (func, limit) => {
    let inThrottle;
    return function executedFunction(...args) {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
};

// Get initials from name
const getInitials = (name) => {
    if (!name) return '';
    return name
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Truncate text
const truncateText = (text, maxLength = 100, suffix = '...') => {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + suffix;
};

// Capitalize first letter
const capitalize = (str) => {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
};

// Convert object to query string
const toQueryString = (obj) => {
    return Object.keys(obj)
        .filter(key => obj[key] !== undefined && obj[key] !== null && obj[key] !== '')
        .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
        .join('&');
};

module.exports = {
    generateUserId,
    generateRoomId,
    generateExpenseId,
    generateGroupId,
    generateOTP,
    generateInviteToken,
    formatDate,
    formatCurrency,
    calculateDistance,
    sanitizeString,
    isValidEmail,
    isValidPhone,
    isValidPincode,
    paginate,
    createSlug,
    generateMetaTags,
    deepClone,
    debounce,
    throttle,
    getInitials,
    truncateText,
    capitalize,
    toQueryString
};
