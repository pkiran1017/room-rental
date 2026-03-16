export type NotificationPrefs = {
    email: boolean;
    chat: boolean;
    push: boolean;
};

export const SETTINGS_PREFS_KEY = 'dashboard-settings-preferences';
export const NOTIFICATION_PREFS_EVENT = 'app:notification-preferences-changed';

export const defaultNotificationPrefs: NotificationPrefs = {
    email: true,
    chat: true,
    push: false
};

export const getNotificationPrefs = (): NotificationPrefs => {
    if (typeof window === 'undefined') {
        return defaultNotificationPrefs;
    }

    const raw = localStorage.getItem(SETTINGS_PREFS_KEY);
    if (!raw) {
        return defaultNotificationPrefs;
    }

    try {
        const parsed = JSON.parse(raw) as Partial<NotificationPrefs>;
        return {
            email: parsed.email ?? defaultNotificationPrefs.email,
            chat: parsed.chat ?? defaultNotificationPrefs.chat,
            push: parsed.push ?? defaultNotificationPrefs.push
        };
    } catch {
        localStorage.removeItem(SETTINGS_PREFS_KEY);
        return defaultNotificationPrefs;
    }
};

export const setNotificationPrefs = (nextPrefs: NotificationPrefs): void => {
    if (typeof window === 'undefined') {
        return;
    }

    localStorage.setItem(SETTINGS_PREFS_KEY, JSON.stringify(nextPrefs));
    window.dispatchEvent(new CustomEvent(NOTIFICATION_PREFS_EVENT, { detail: nextPrefs }));
};
