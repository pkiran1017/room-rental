/**
 * GLOBAL SEO OPTIMIZED TEXT CONTENT LIBRARY
 * Dynamic templates for ANY city, ANY country, ANY property type
 * Keywords, meta descriptions, and semantic content for all pages
 * Optimized for search ranking on Google, Bing, and other engines WORLDWIDE
 */

/**
 * Dynamic SEO Content Generator
 */
export const SEO_CONTENT = {
    // HOME PAGE - DYNAMIC
    HOME: (city: string = 'Pune', brandName: string = 'Property Portal') => ({
        h1: `Find Your Perfect Property in ${city} - Safe & Verified Listings`,
        h2_array: [
            `Search Rooms & Apartments by Location in ${city}`,
            'Connect with Verified Property Owners & Brokers',
            'Secure Booking Process with Payment Protection',
            'Hundreds of Neighborhoods with Instant Listings'
        ],
        paragraph_intro: `${brandName} is your most trusted platform for finding safe, verified rooms, apartments & houses. With thousands of active listings across ${city} and worldwide, we help you find the perfect accommodation in minutes. Whether you're looking for a PG, shared flat, independent apartment, or house, ${brandName} connects you directly with verified owners and roommates.`,
        keywords_long_tail: [
            `find rooms for rent in ${city} online`,
            `best PG near me ${city}`,
            'safe property rental platform',
            `instant booking ${city}`,
            'verified landlord listings'
        ]
    }),

    // ROOMS LIST PAGE - DYNAMIC
    ROOMS_LIST: (city: string = 'Pune', propertyType: string = 'Rooms') => ({
        h1: `Browse All ${propertyType} & Properties Available in ${city} | Filter by Location & Price`,
        h2_array: [
            `Search ${propertyType} by City, Area & Neighborhood`,
            'Filter by Price, Furnishing & Amenities',
            'View Detailed Photos & Virtual Tours',
            'Connect Directly with Property Owners',
            'Verified Listings from Trusted Sources'
        ],
        meta_description: `Search thousands of verified ${propertyType.toLowerCase()} listings in ${city}. Filter by location, price, amenities. PG, shared flats, apartments ${city}.`,
        schema_breadcrumb: [
            { name: 'Home', url: '/' },
            { name: city, url: `/city/${city.toLowerCase()}` },
            { name: propertyType, url: `/rooms?city=${city}` }
        ]
    }),

    // ROOM DETAIL PAGE - DYNAMIC
    ROOM_DETAIL: {
        h1_template: (title: string, city: string, area?: string) =>
            `${title} - Property for Rent in ${area ? `${area}, ` : ''}${city}`,
        h2_array: [
            'Property Details & Features',
            'Price & Deposit Information',
            'Amenities & Facilities',
            'Area Highlights & Nearby Places',
            'Owner Details & Reviews',
            'Booking Information'
        ],
        meta_description_template: (price: number, propertyType: string, amenities: string[], city: string, area?: string) =>
            `Rent ${propertyType} for ₹${price}/month with ${amenities.slice(0, 3).join(', ')} in ${area || city}. Verified listing. Instant booking available.`,
        rich_text_template: (roomData: any) => `
            This is a beautiful ${roomData.propertyType || roomData.roomType} located in ${roomData.area ? `${roomData.area}, ` : ''}${roomData.city}.
            The property features ${roomData.amenities.join(', ')}. 
            Monthly rent is ₹${roomData.rent} with a security deposit of ₹${roomData.deposit || roomData.rent}.
            Perfect for ${roomData.bestFor || 'professionals and students'}.
            ${roomData.furnishing ? `Furnishing: ${roomData.furnishing}.` : ''}
            Contact the owner today to schedule a viewing or book instantly online.
        `
    },

    // BROKERS PAGE - DYNAMIC
    BROKERS: (city: string = 'Pune') => ({
        h1: `Find Verified Property Brokers & Real Estate Agents in ${city}`,
        h2_array: [
            'Browse Verified Broker Profiles',
            'View Broker Ratings & Reviews',
            'Check Broker Specialization & Experience',
            'Direct Messaging with Brokers',
            'Verified Transaction History'
        ],
        meta_description: `Connect with verified property brokers in ${city}. Check profiles, ratings, active listings. Find trusted real estate professionals.`,
    }),

    // BROKER PROFILE PAGE - DYNAMIC
    BROKER_PROFILE: {
        h1_template: (name: string, city: string) =>
            `${name} - Verified Property Broker & Real Estate Agent in ${city}`,
        h2_array: [
            'Broker Profile & Credentials',
            'Active Property Listings',
            'Client Reviews & Ratings',
            'Broker Specialization',
            'Contact & Connect Options'
        ],
        meta_description_template: (name: string, listings: number, city: string) =>
            `Connect with ${name}, verified property broker in ${city}. ${listings}+ active listings. View properties & schedule viewings.`,
    },

    // ABOUT PAGE - DYNAMIC
    ABOUT: (brandName: string = 'Property Portal', country: string = 'India') => ({
        h1: `About ${brandName} - ${country}'s Safest Property Rental Platform`,
        h2_array: [
            'Our Mission & Vision',
            `Why Choose ${brandName}?`,
            'Safety & Verification Process',
            'Community Impact & Growth',
            'Partner With Us'
        ],
        paragraphs: (brandName: string) => [
            `${brandName} was founded with a mission to revolutionize the property rental market globally. We believe everyone deserves access to safe, affordable, and verified housing without the hassle of dealing with fraudulent listings or untrustworthy landlords.`,
            `With years of experience and thousands of satisfied customers, we've established ourselves as one of the most trusted platforms for property rentals worldwide.`,
            `Our proprietary verification system checks every listing against multiple databases to ensure you're dealing with genuine owners. We verify phone numbers, property documents, and owner credentials.`,
            `We're committed to providing transparent pricing with zero hidden charges, secure payment processing, and 24/7 customer support in multiple languages.`
        ]
    }),

    // CONTACT PAGE - DYNAMIC
    CONTACT: (brandName: string = 'Property Portal') => ({
        h1: `Contact ${brandName} - 24/7 Customer Support`,
        h2_array: [
            'Get in Touch With Us',
            'Live Chat Support',
            'Email Support',
            'Phone Support'
        ],
        meta_description: `Contact ${brandName} for any queries. 24/7 customer support available. Call, email, or live chat with our team.`,
    }),

    // FAQ PAGE - DYNAMIC
    FAQ: (brandName: string = 'Property Portal') => ({
        h1: `Frequently Asked Questions About ${brandName}`,
        h2_array: [
            'About Property Search & Listings',
            'Safety & Verification',
            'Payment & Booking',
            'For Property Owners',
            'Dispute Resolution'
        ],
        questions: [
            {
                q: `How do I search for properties on ${brandName}?`,
                a: `Use our search bar to enter your preferred city or area. Filter by location, price range, property type, and amenities. You can also view featured and recently added listings on our homepage.`
            },
            {
                q: `Are all listings on ${brandName} verified?`,
                a: `Yes! Every listing undergoes our proprietary verification process. We verify owner identity, contact details, property documents, and images before listing.`
            },
            {
                q: `How much does it cost to use ${brandName}?`,
                a: `${brandName} is completely free for property searchers. Property owners can list properties for free. Premium features are available for enhanced visibility.`
            },
            {
                q: 'Can I view properties online before visiting?',
                a: 'Absolutely! Every listing includes high-quality photos and virtual tours. You can message the owner for a video walkthrough or schedule a virtual viewing.'
            },
            {
                q: `How do I book a property on ${brandName}?`,
                a: 'Browse listings, click on a property you like, review details, message the owner, and once you\'ve agreed on terms, you can secure the booking online with protected payment.'
            },
            {
                q: 'Is my payment secure?',
                a: 'Yes! We use industry-standard encryption and secure payment gateways. Your payment information is never stored on our servers.'
            },
            {
                q: 'What if I face issues with a property?',
                a: 'Our customer support team is available 24/7 to resolve any disputes. We maintain transparent communication between tenants and owners.'
            },
            {
                q: 'Can I list my property for rent?',
                a: 'Yes! Create a free account, click "Post Property" and fill in the details. Your listing will go live after verification (usually within 24 hours).'
            }
        ]
    }),

    // CITY LANDING PAGE - DYNAMIC
    CITY_LANDING: (city: string) => ({
        h1: `Find Properties for Rent in ${city} - Rooms, Apartments & Houses`,
        h2_array: [
            `Popular Areas in ${city}`,
            `Average Rent Prices in ${city}`,
            `Why Live in ${city}?`,
            `Property Types Available in ${city}`,
            `Transportation & Connectivity`
        ],
        paragraph_intro: `Looking for properties in ${city}? Browse thousands of verified listings including rooms, PGs, apartments, and houses. Our platform connects you with trusted property owners and brokers in ${city}. Find your perfect home today!`,
        keywords_long_tail: [
            `rooms for rent in ${city}`,
            `apartments ${city}`,
            `PG in ${city}`,
            `houses for rent ${city}`,
            `property ${city}`,
            `accommodation ${city}`
        ]
    }),

    // AREA LANDING PAGE - DYNAMIC
    AREA_LANDING: (area: string, city: string) => ({
        h1: `${area}, ${city} - Properties for Rent | Rooms, Apartments & Houses`,
        h2_array: [
            `About ${area}`,
            `Properties Available in ${area}`,
            `Nearby Amenities & Facilities`,
            `Transportation in ${area}`,
            `Average Rent in ${area}`
        ],
        paragraph_intro: `Explore properties for rent in ${area}, ${city}. ${area} is a popular residential area known for its excellent connectivity and amenities. Find rooms, PGs, apartments, and houses with verified owners.`,
        keywords_long_tail: [
            `rooms in ${area}`,
            `PG in ${area}`,
            `flats in ${area} ${city}`,
            `accommodation ${area}`,
            `property near ${area}`
        ]
    })
};

/**
 * Schema.org BreadcrumbList for different pages - DYNAMIC
 */
export const BREADCRUMB_SCHEMA = {
    HOME: () => [
        { name: 'Home', url: '/' }
    ],
    ROOMS_LIST: (city?: string) => [
        { name: 'Home', url: '/' },
        ...(city ? [{ name: city, url: `/city/${city.toLowerCase()}` }] : []),
        { name: 'Properties', url: '/rooms' }
    ],
    ROOM_DETAIL: (title: string, city?: string, area?: string) => [
        { name: 'Home', url: '/' },
        ...(city ? [{ name: city, url: `/city/${city.toLowerCase()}` }] : []),
        ...(area ? [{ name: area, url: `/area/${area.toLowerCase()}` }] : []),
        { name: 'Properties', url: '/rooms' },
        { name: title, url: '' }
    ],
    BROKERS: (city?: string) => [
        { name: 'Home', url: '/' },
        ...(city ? [{ name: city, url: `/city/${city.toLowerCase()}` }] : []),
        { name: 'Brokers', url: '/brokers' }
    ],
    BROKER_PROFILE: (name: string, city?: string) => [
        { name: 'Home', url: '/' },
        ...(city ? [{ name: city, url: `/city/${city.toLowerCase()}` }] : []),
        { name: 'Brokers', url: '/brokers' },
        { name: name, url: '' }
    ],
    CITY_PAGE: (city: string) => [
        { name: 'Home', url: '/' },
        { name: city, url: '' }
    ],
    AREA_PAGE: (area: string, city: string) => [
        { name: 'Home', url: '/' },
        { name: city, url: `/city/${city.toLowerCase()}` },
        { name: area, url: '' }
    ]
};

/**
 * Internal linking strategy for SEO - DYNAMIC
 */
export const INTERNAL_LINKS = {
    HOME: (city: string = 'Pune') => [
        { text: 'Search Properties', href: '/rooms' },
        { text: 'Find Brokers', href: '/brokers' },
        { text: 'Featured Listings', href: '/rooms?featured=true' },
        { text: 'About Us', href: '/about' },
        { text: `Properties in ${city}`, href: `/city/${city.toLowerCase()}` }
    ],
    ROOMS_LIST: (city?: string) => [
        { text: 'Home', href: '/' },
        { text: 'Find Brokers', href: '/brokers' },
        { text: 'How to Rent Safely', href: '/about' },
        ...(city ? [{ text: `All Areas in ${city}`, href: `/city/${city}` }] : []),
        { text: 'Contact Support', href: '/contact' }
    ],
    ROOM_DETAIL: (brokerId?: string, city?: string, area?: string) => [
        { text: 'Back to Listings', href: '/rooms' },
        ...(brokerId ? [{ text: 'View Owner Profile', href: `/broker/${brokerId}` }] : []),
        ...(area && city ? [{ text: `More in ${area}`, href: `/rooms?city=${city}&area=${area}` }] : []),
        ...(city ? [{ text: `All ${city} Properties`, href: `/city/${city}` }] : []),
        { text: 'Contact Support', href: '/contact' }
    ]
};

/**
 * Related searches for homepage and category pages - DYNAMIC
 */
export const RELATED_SEARCHES = {
    HOME: (city: string = 'Pune', areas: string[] = ['Aundh', 'Hinjewadi', 'MG Road', 'Baner']) => [
        ...areas.map(area => `rooms in ${area}`),
        `PG ${city}`,
        `apartments ${city}`,
        `budget rooms ${city}`,
        `luxury apartments ${city}`,
        `furnished rooms ${city}`
    ],
    ROOMS_LIST: (city?: string) => [
        'rooms for rent today',
        'newly listed properties',
        'furnished rooms',
        'budget-friendly options',
        'premium accommodations',
        ...(city ? [`best areas in ${city}`, `affordable ${city}`] : [])
    ],
    CITY_PAGE: (areas: string[]) => [
        ...areas.map(area => `properties in ${area}`),
        'best neighborhoods',
        'affordable areas',
        'luxury localities'
    ]
};

/**
 * CTA (Call-to-Action) copy optimized for conversion - UNIVERSAL
 */
export const CTA_COPY = {
    PRIMARY: 'Search Properties Now',
    SECONDARY: 'View All Listings',
    BROKER: 'Connect with Broker',
    CONTACT: 'Message Owner',
    BOOK: 'Book This Property',
    FILTER: 'Apply Filters',
    SEARCH: 'Search Properties',
    SCHEDULE_VISIT: 'Schedule a Visit',
    VIEW_DETAILS: 'View Details',
    SAVE_LISTING: 'Save for Later',
    SHARE: 'Share Property',
    REPORT: 'Report Listing'
};

/**
 * LSI (Latent Semantic Indexing) Keywords - GLOBAL
 */
export const LSI_KEYWORDS = [
    'accommodation', 'housing', 'lodging', 'residence',
    'rental', 'lease', 'tenancy', 'occupancy',
    'apartment', 'flat', 'unit', 'dwelling',
    'landlord', 'owner', 'lessor', 'property manager',
    'tenant', 'renter', 'lessee', 'occupant',
    'deposit', 'advance', 'security',
    'amenities', 'facilities', 'features',
    'furnished', 'equipped', 'fitted',
    'location', 'area', 'neighborhood', 'locality',
    'connectivity', 'transport', 'access'
];

/**
 * Page-specific nofollow links (for affiliate, external, or low-trust sites)
 */
export const NOFOLLOW_DOMAINS = [
    'facebook.com',
    'instagram.com',
    'twitter.com',
    'x.com',
    'youtube.com',
    'pinterest.com',
    'reddit.com',
    'linkedin.com'
];

/**
 * Semantic HTML best practices - GLOBAL SEO STANDARDS
 */
export const SEMANTIC_HTML_RULES = {
    USE_H1_ONCE: 'Every page should have exactly ONE h1 tag with primary keyword',
    H_TAG_HIERARCHY: 'Use h2, h3, h4 in proper hierarchy without skipping levels',
    USE_ARTICLE_TAG: 'Wrap main content in <article> tags',
    USE_SECTION_TAG: 'Use <section> for thematic groupings',
    USE_NAV_TAG: 'Wrap navigation in <nav> tags',
    USE_ASIDE_TAG: 'Use <aside> for sidebar/complementary content',
    USE_FOOTER_TAG: 'Wrap footer in <footer> tag',
    USE_HEADER_TAG: 'Wrap site header in <header> tag',
    USE_TIME_TAG: 'Use <time> for dates and times',
    USE_MARK_TAG: 'Use <mark> for highlighted/emphasized text',
    USE_STRONG_TAG: 'Use <strong> for important text (not <b>)',
    USE_EM_TAG: 'Use <em> for emphasized text (not <i>)'
};
