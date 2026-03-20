export const WARM_ROOMS_LIST_KEY = 'warm-rooms-list-v1';
export const WARM_BROKERS_LIST_KEY = 'warm-brokers-list-v1';
export const WARM_CACHE_MAX_AGE_MS = 2 * 60 * 1000;

type WarmPayload<T> = {
    createdAt: number;
    data: T;
};

export const writeWarmCache = <T>(key: string, data: T): void => {
    try {
        const payload: WarmPayload<T> = {
            createdAt: Date.now(),
            data,
        };
        window.sessionStorage.setItem(key, JSON.stringify(payload));
    } catch {
        // Ignore cache write failures.
    }
};

export const readWarmCache = <T>(key: string, maxAgeMs = WARM_CACHE_MAX_AGE_MS): T | null => {
    try {
        const raw = window.sessionStorage.getItem(key);
        if (!raw) return null;

        const parsed = JSON.parse(raw) as WarmPayload<T>;
        if (!parsed?.createdAt) return null;
        if (Date.now() - parsed.createdAt > maxAgeMs) return null;

        return parsed.data;
    } catch {
        return null;
    }
};
