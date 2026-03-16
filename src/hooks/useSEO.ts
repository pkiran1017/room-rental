/**
 * SEO Hook for Dynamic Meta Tag Management
 * Handles Helmet-like functionality for React
 */

import { useEffect } from 'react';
import type { SEOConfig } from '../lib/seoUtils';

export function useSEO(config: SEOConfig, baseTitle: string = 'Pune Rooms') {
    useEffect(() => {
        // Update document title
        document.title = config.title || baseTitle;

        // Update meta description
        updateMetaTag('description', config.description || '');

        // Update meta keywords
        if (config.keywords && config.keywords.length > 0) {
            updateMetaTag('keywords', config.keywords.join(', '));
        }

        // Update canonical URL
        if (config.canonicalUrl) {
            updateCanonicalLink(config.canonicalUrl);
        }

        // Update robots directive
        if (config.robots) {
            updateMetaTag('robots', config.robots);
        }

        // Update author
        if (config.author) {
            updateMetaTag('author', config.author);
        }

        // Update Open Graph tags
        if (config.ogTitle) updateMetaTag('og:title', config.ogTitle, 'property');
        if (config.ogDescription) updateMetaTag('og:description', config.ogDescription, 'property');
        if (config.ogImage) updateMetaTag('og:image', config.ogImage, 'property');
        if (config.ogUrl) updateMetaTag('og:url', config.ogUrl, 'property');
        if (config.ogType) updateMetaTag('og:type', config.ogType, 'property');

        // Update Twitter Card tags
        if (config.twitterCard) updateMetaTag('twitter:card', config.twitterCard);
        if (config.twitterImage) updateMetaTag('twitter:image', config.twitterImage);

        // Update or inject structured data
        if (config.structuredData) {
            updateStructuredData(config.structuredData);
        }

        // Scroll to top on page change (good for UX)
        window.scrollTo(0, 0);

    }, [config, baseTitle]);
}

/**
 * Helper to update meta tag
 */
function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);
    
    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
    }
    
    element.setAttribute('content', content);
}

/**
 * Helper to update canonical link
 */
function updateCanonicalLink(url: string) {
    let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    
    if (!link) {
        link = document.createElement('link');
        link.rel = 'canonical';
        document.head.appendChild(link);
    }
    
    link.href = url;
}

/**
 * Helper to update structured data JSON-LD
 */
function updateStructuredData(data: any) {
    // Remove old structured data
    const oldScripts = document.querySelectorAll('script[type="application/ld+json"]');
    oldScripts.forEach(script => {
        if (script.id && script.id.startsWith('schema-')) {
            script.remove();
        }
    });

    // Add new structured data
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.id = `schema-${Date.now()}`;
    script.textContent = JSON.stringify(data);
    document.head.appendChild(script);
}

/**
 * Add preconnect for external resources (performance optimization)
 */
export function useSEOPreconnect(urls: string[]) {
    useEffect(() => {
        urls.forEach(url => {
            let link = document.querySelector(`link[rel="preconnect"][href="${url}"]`) as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'preconnect';
                link.href = url;
                link.setAttribute('crossorigin', 'anonymous');
                document.head.appendChild(link);
            }
        });
    }, [urls]);
}

/**
 * Add DNS prefetch for third-party domains
 */
export function useSEODNSPrefetch(urls: string[]) {
    useEffect(() => {
        urls.forEach(url => {
            let link = document.querySelector(`link[rel="dns-prefetch"][href="${url}"]`) as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'dns-prefetch';
                link.href = url;
                document.head.appendChild(link);
            }
        });
    }, [urls]);
}

/**
 * Add image lazy loading with intersection observer
 */
export function useLazyLoadImages() {
    useEffect(() => {
        const images = document.querySelectorAll('img[data-src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target as HTMLImageElement;
                        img.src = img.dataset.src || '';
                        img.removeAttribute('data-src');
                        imageObserver.unobserve(img);
                    }
                });
            });

            images.forEach(img => imageObserver.observe(img));

            return () => {
                images.forEach(img => imageObserver.unobserve(img));
            };
        }
    }, []);
}

/**
 * Track page views for analytics
 */
export function useSEOTracking(pageName: string, properties?: Record<string, any>) {
    useEffect(() => {
        // Google Analytics 4 tracking
        if (typeof window !== 'undefined' && 'gtag' in window) {
            (window as any).gtag('config', 'GA_MEASUREMENT_ID', {
                page_path: window.location.pathname,
                page_title: document.title
            });
        }

        // Custom tracking
        const trackingData = {
            page: pageName,
            timestamp: new Date().toISOString(),
            ...properties
        };

        // Send to analytics endpoint if available
        if (import.meta.env.VITE_ANALYTICS_ENDPOINT) {
            navigator.sendBeacon(
                import.meta.env.VITE_ANALYTICS_ENDPOINT,
                JSON.stringify(trackingData)
            );
        }
    }, [pageName, properties]);
}
