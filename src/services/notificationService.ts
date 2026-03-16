import { get, put, del } from './api';
import type { ApiResponse, Notification } from '@/types';

interface NotificationsResponse {
    data: Notification[];
    unreadCount: number;
}

export const getNotifications = async (isRead?: boolean, page = 1, limit = 20): Promise<NotificationsResponse> => {
    const params = new URLSearchParams();
    if (isRead !== undefined) params.append('isRead', String(isRead));
    params.append('page', String(page));
    params.append('limit', String(limit));

    const response = await get<ApiResponse<Notification[]>>(`/notifications?${params}`);
    return {
        data: response.data,
        unreadCount: response.unreadCount || 0
    };
};

export const markAsRead = async (notificationId: number): Promise<void> => {
    await put<ApiResponse<void>>(`/notifications/${notificationId}/read`, {});
};

export const markAllAsRead = async (): Promise<void> => {
    await put<ApiResponse<void>>('/notifications/read-all', {});
};

export const deleteNotification = async (notificationId: number): Promise<void> => {
    await del<ApiResponse<void>>(`/notifications/${notificationId}`);
};

export const getNotificationPreferences = async (): Promise<any> => {
    const response = await get<ApiResponse<any>>('/notifications/preferences');
    return response.data;
};
