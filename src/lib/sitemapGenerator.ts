/**
 * Sitemap Generator Utility
 * Generates XML sitemaps for Google, Bing, and other search engines
 * Optimizes for crawl budget and discoverability
 */

interface SitemapEntry {
    url: string;
    lastmod?: string;
    changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
    priority?: number;
    images?: Array<{ url: string; caption?: string; title?: string }>;
}

export class SitemapGenerator {
    private baseUrl: string;
    private entries: SitemapEntry[] = [];

    constructor(baseUrl: string = 'https://pumeroom.com') {
        this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    }

    /**
     * Add entry to sitemap
     */
    addEntry(entry: SitemapEntry): void {
        this.entries.push(entry);
    }

    /**
     * Add multiple entries
     */
    addEntries(entries: SitemapEntry[]): void {
        this.entries.push(...entries);
    }

    /**
     * Generate XML sitemap
     */
    generateXML(): string {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"\n';
        xml += '         xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"\n';
        xml += '         xmlns:mobile="http://www.google.com/schemas/sitemap-mobile/1.0">\n';

        this.entries.forEach(entry => {
            xml += '  <url>\n';
            xml += `    <loc>${this.escapeXml(entry.url)}</loc>\n`;

            if (entry.lastmod) {
                xml += `    <lastmod>${entry.lastmod}</lastmod>\n`;
            }

            if (entry.changefreq) {
                xml += `    <changefreq>${entry.changefreq}</changefreq>\n`;
            }

            if (entry.priority !== undefined) {
                xml += `    <priority>${entry.priority.toFixed(1)}</priority>\n`;
            }

            // Add image entries if present
            if (entry.images && entry.images.length > 0) {
                entry.images.forEach(image => {
                    xml += '    <image:image>\n';
                    xml += `      <image:loc>${this.escapeXml(image.url)}</image:loc>\n`;
                    if (image.caption) {
                        xml += `      <image:caption>${this.escapeXml(image.caption)}</image:caption>\n`;
                    }
                    if (image.title) {
                        xml += `      <image:title>${this.escapeXml(image.title)}</image:title>\n`;
                    }
                    xml += '    </image:image>\n';
                });
            }

            xml += '  </url>\n';
        });

        xml += '</urlset>';
        return xml;
    }

    /**
     * Generate sitemap index (for large sitemaps)
     */
    generateSitemapIndex(sitemaps: Array<{ loc: string; lastmod?: string }>): string {
        let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
        xml += '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

        sitemaps.forEach(sitemap => {
            xml += '  <sitemap>\n';
            xml += `    <loc>${this.escapeXml(sitemap.loc)}</loc>\n`;
            if (sitemap.lastmod) {
                xml += `    <lastmod>${sitemap.lastmod}</lastmod>\n`;
            }
            xml += '  </sitemap>\n';
        });

        xml += '</sitemapindex>';
        return xml;
    }

    /**
     * Escape special XML characters
     */
    private escapeXml(str: string): string {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Generate main sitemap entries (static content)
     */
    generateMainSitemapEntries(): SitemapEntry[] {
        return [
            {
                url: this.baseUrl,
                changefreq: 'daily',
                priority: 1.0
            },
            {
                url: `${this.baseUrl}/rooms`,
                changefreq: 'hourly',
                priority: 0.9
            },
            {
                url: `${this.baseUrl}/brokers`,
                changefreq: 'daily',
                priority: 0.8
            },
            {
                url: `${this.baseUrl}/about`,
                changefreq: 'monthly',
                priority: 0.6
            },
            {
                url: `${this.baseUrl}/contact`,
                changefreq: 'monthly',
                priority: 0.6
            },
            {
                url: `${this.baseUrl}/terms`,
                changefreq: 'monthly',
                priority: 0.5
            },
            {
                url: `${this.baseUrl}/privacy`,
                changefreq: 'monthly',
                priority: 0.5
            },
            {
                url: `${this.baseUrl}/faq`,
                changefreq: 'weekly',
                priority: 0.7
            }
        ];
    }

    /**
     * Generate city-specific sitemap entries
     */
    generateCitySitemapEntries(cities: string[]): SitemapEntry[] {
        return cities.map(city => ({
            url: `${this.baseUrl}/rooms?city=${city}`,
            changefreq: 'weekly',
            priority: 0.7
        }));
    }

    /**
     * Generate room listing sitemaps (dynamic)
     */
    generateRoomSitemapEntries(rooms: Array<{
        id: string;
        slug: string;
        title: string;
        image?: string;
        updatedAt?: string;
    }>): SitemapEntry[] {
        return rooms.map(room => ({
            url: `${this.baseUrl}/room/${room.id}/${room.slug}`,
            lastmod: room.updatedAt || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.7,
            images: room.image ? [{ url: room.image, title: room.title }] : undefined
        }));
    }

    /**
     * Generate broker profile sitemaps (dynamic)
     */
    generateBrokerSitemapEntries(brokers: Array<{
        id: string;
        slug: string;
        name: string;
        avatar?: string;
        updatedAt?: string;
    }>): SitemapEntry[] {
        return brokers.map(broker => ({
            url: `${this.baseUrl}/broker/${broker.id}/${broker.slug}`,
            lastmod: broker.updatedAt || new Date().toISOString().split('T')[0],
            changefreq: 'weekly',
            priority: 0.6,
            images: broker.avatar ? [{ url: broker.avatar, title: broker.name }] : undefined
        }));
    }

    /**
     * Get entry count
     */
    getEntryCount(): number {
        return this.entries.length;
    }

    /**
     * Clear all entries
     */
    clear(): void {
        this.entries = [];
    }

    /**
     * Get last entry count (for sitemap efficiency)
     */
    checkSitemapSize(): { entryCount: number; estimatedSizeKB: number; needsSplit: boolean } {
        const xmlSize = this.generateXML().length / 1024;
        const needsSplit = this.entries.length > 50000 || xmlSize > 50000;

        return {
            entryCount: this.entries.length,
            estimatedSizeKB: xmlSize,
            needsSplit
        };
    }
}

/**
 * Standard sitemaps configuration
 */
export const SITEMAPS_CONFIG = {
    main: {
        name: 'sitemap.xml',
        description: 'Main sitemap for homepage, about, contact pages',
        updateFrequency: 'weekly'
    },
    rooms: {
        name: 'sitemap-rooms.xml',
        description: 'Sitemap for all room listings',
        updateFrequency: 'daily',
        maxEntries: 50000
    },
    brokers: {
        name: 'sitemap-brokers.xml',
        description: 'Sitemap for broker profiles',
        updateFrequency: 'weekly',
        maxEntries: 10000
    },
    cities: {
        name: 'sitemap-cities.xml',
        description: 'Sitemap for city-specific search pages',
        updateFrequency: 'weekly'
    }
};

/**
 * Generate all sitemaps for production
 */
export async function generateAllSitemaps(
    rooms: any[],
    brokers: any[],
    cities: string[]
): Promise<Map<string, string>> {
    const sitemaps = new Map<string, string>();

    // Main sitemap
    const mainGen = new SitemapGenerator();
    mainGen.addEntries(mainGen.generateMainSitemapEntries());
    sitemaps.set(SITEMAPS_CONFIG.main.name, mainGen.generateXML());

    // Rooms sitemap
    const roomsGen = new SitemapGenerator();
    roomsGen.addEntries(roomsGen.generateRoomSitemapEntries(rooms));
    sitemaps.set(SITEMAPS_CONFIG.rooms.name, roomsGen.generateXML());

    // Brokers sitemap
    const brokersGen = new SitemapGenerator();
    brokersGen.addEntries(brokersGen.generateBrokerSitemapEntries(brokers));
    sitemaps.set(SITEMAPS_CONFIG.brokers.name, brokersGen.generateXML());

    // Cities sitemap
    const citiesGen = new SitemapGenerator();
    citiesGen.addEntries(citiesGen.generateCitySitemapEntries(cities));
    sitemaps.set(SITEMAPS_CONFIG.cities.name, citiesGen.generateXML());

    // Sitemap index
    const indexGen = new SitemapGenerator();
    const sitemapIndex = indexGen.generateSitemapIndex([
        { loc: 'https://pumeroom.com/sitemap.xml' },
        { loc: 'https://pumeroom.com/sitemap-rooms.xml' },
        { loc: 'https://pumeroom.com/sitemap-brokers.xml' },
        { loc: 'https://pumeroom.com/sitemap-cities.xml' }
    ]);
    sitemaps.set('sitemap-index.xml', sitemapIndex);

    return sitemaps;
}
