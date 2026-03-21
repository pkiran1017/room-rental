import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ScrollToTop: React.FC = () => {
    const { pathname, search, hash } = useLocation();

    useEffect(() => {
        if (hash) {
            const id = hash.replace('#', '');
            let timer: number | undefined;
            let attempts = 0;

            const scrollWhenReady = () => {
                const element = document.getElementById(id);
                if (element) {
                    window.requestAnimationFrame(() => {
                        const headerHeight = window.innerWidth < 640 ? 72 : 88;
                        const top = element.getBoundingClientRect().top + window.scrollY - headerHeight;
                        window.scrollTo({ top, behavior: 'smooth' });
                    });
                    return;
                }

                if (attempts >= 20) {
                    return;
                }

                attempts += 1;
                timer = window.setTimeout(scrollWhenReady, 150);
            };

            timer = window.setTimeout(scrollWhenReady, 120);

            return () => {
                if (typeof timer === 'number') {
                    window.clearTimeout(timer);
                }
            };
        }

        window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
    }, [pathname, search, hash]);

    return null;
};

export default ScrollToTop;
