/**
 * SEO Routes - Sitemap, Robots, and Search Engine Optimization
 * Generates dynamic sitemaps and serves SEO files
 */

const express = require('express');
const router = express.Router();
const db = require('../config/database');

/**
 * GET /sitemap.xml - Main Sitemap
 */
router.get('/sitemap.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    
    // Static pages
    const staticPages = [
        { url: '/', lastmod: new Date().toISOString().split('T')[0], priority: 1.0, changefreq: 'daily' },
        { url: '/rooms', lastmod: new Date().toISOString().split('T')[0], priority: 0.9, changefreq: 'hourly' },
        { url: '/brokers', lastmod: new Date().toISOString().split('T')[0], priority: 0.8, changefreq: 'daily' },
        { url: '/about', priority: 0.6, changefreq: 'monthly' },
        { url: '/contact', priority: 0.6, changefreq: 'monthly' },
        { url: '/terms', priority: 0.5, changefreq: 'yearly' },
    ];
    
    staticPages.forEach(page => {
        xml += '  <url>\n';
        xml += `    <loc>https://pumeroom.com${page.url}</loc>\n`;
        if (page.lastmod) xml += `    <lastmod>${page.lastmod}</lastmod>\n`;
        xml += `    <changefreq>${page.changefreq}</changefreq>\n`;
        xml += `    <priority>${page.priority}</priority>\n`;
        xml += '  </url>\n';
    });
    
    xml += '</urlset>';
    res.send(xml);
});

/**
 * GET /sitemap-rooms.xml - Room Listings Sitemap (Dynamic)
 */
router.get('/sitemap-rooms.xml', async (req, res) => {
    res.set('Content-Type', 'application/xml');
    
    try {
        const rooms = await db.query(
            'SELECT id, title, slug, image, updated_at FROM rooms WHERE status = ? LIMIT 50000',
            ['active']
        );

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

        rooms.forEach((room) => {
            xml += '  <url>\n';
            xml += `    <loc>https://pumeroom.com/room/${room.id}/${room.slug}</loc>\n`;
            xml += `    <lastmod>${room.updated_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.8</priority>\n';
            
            if (room.image) {
                xml += '    <image:image>\n';
                xml += `      <image:loc>${room.image}</image:loc>\n`;
                xml += `      <image:title>${escapeXml(room.title)}</image:title>\n`;
                xml += '    </image:image>\n';
            }
            
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        res.send(xml);
    } catch (error) {
        console.error('Error generating rooms sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

/**
 * GET /sitemap-brokers.xml - Broker Profiles Sitemap (Dynamic)
 */
router.get('/sitemap-brokers.xml', async (req, res) => {
    res.set('Content-Type', 'application/xml');
    
    try {
        const brokers = await db.query(
            'SELECT id, name, slug, profile_image, updated_at FROM users WHERE role = ? AND status = ? LIMIT 10000',
            ['broker', 'active']
        );

        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n';

        brokers.forEach((broker) => {
            xml += '  <url>\n';
            xml += `    <loc>https://pumeroom.com/broker/${broker.id}/${broker.slug}</loc>\n`;
            xml += `    <lastmod>${broker.updated_at?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0]}</lastmod>\n`;
            xml += '    <changefreq>weekly</changefreq>\n';
            xml += '    <priority>0.7</priority>\n';
            
            if (broker.profile_image) {
                xml += '    <image:image>\n';
                xml += `      <image:loc>${broker.profile_image}</image:loc>\n`;
                xml += `      <image:title>${escapeXml(broker.name)}</image:title>\n`;
                xml += '    </image:image>\n';
            }
            
            xml += '  </url>\n';
        });

        xml += '</urlset>';
        res.send(xml);
    } catch (error) {
        console.error('Error generating brokers sitemap:', error);
        res.status(500).send('Error generating sitemap');
    }
});

/**
 * GET /sitemap-cities.xml - City Pages Sitemap
 */
router.get('/sitemap-cities.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    
    const cities = [
        'pune', 'mumbai', 'bangalore', 'hyderabad', 'delhi',
        'aundh', 'hinjewadi', 'kalyani-nagar', 'mg-road', 'camp',
        'shivaji-nagar', 'baner', 'hadapsar', 'wakad', 'kothrud'
    ];

    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

    cities.forEach(city => {
        xml += '  <url>\n';
        xml += `    <loc>https://pumeroom.com/rooms?city=${city}</loc>\n`;
        xml += '    <changefreq>weekly</changefreq>\n';
        xml += '    <priority>0.7</priority>\n';
        xml += '  </url>\n';
    });

    xml += '</urlset>';
    res.send(xml);
});

/**
 * GET /sitemap-index.xml - Sitemap Index
 */
router.get('/sitemap-index.xml', (req, res) => {
    res.set('Content-Type', 'application/xml');
    
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
    xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
    xml += '  <sitemap>\n';
    xml += '    <loc>https://pumeroom.com/sitemap.xml</loc>\n';
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
    xml += '  <sitemap>\n';
    xml += '    <loc>https://pumeroom.com/sitemap-rooms.xml</loc>\n';
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
    xml += '  <sitemap>\n';
    xml += '    <loc>https://pumeroom.com/sitemap-brokers.xml</loc>\n';
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
    xml += '  <sitemap>\n';
    xml += '    <loc>https://pumeroom.com/sitemap-cities.xml</loc>\n';
    xml += `    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>\n`;
    xml += '  </sitemap>\n';
    xml += '</sitemapindex>';
    res.send(xml);
});

/**
 * GET /.well-known/security.txt - Security Policy
 */
router.get('/.well-known/security.txt', (req, res) => {
    res.set('Content-Type', 'text/plain');
    const securityTxt = `Contact: security@pumeroom.com
Expires: ${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()}
Preferred-Languages: en
`;
    res.send(securityTxt);
});

/**
 * Helper to escape XML special characters
 */
function escapeXml(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
}

module.exports = router;
