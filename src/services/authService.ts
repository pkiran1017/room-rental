import { post, get, put } from './api';
import type { ApiResponse, User, LoginFormData, RegisterFormData } from '@/types';

interface LoginResponse {
    token: string;
    user: User;
}

interface RegisterResponse {
    userId: number;
    uniqueId: string;
    email: string;
    role: string;
    brokerStatus?: string;
    requiresVerification: boolean;
}

export const login = async (data: LoginFormData): Promise<LoginResponse> => {
    const response = await post<ApiResponse<LoginResponse>>('/auth/login', data);
    return response.data;
};

export const register = async (data: RegisterFormData): Promise<RegisterResponse> => {
    const response = await post<ApiResponse<RegisterResponse>>('/auth/register', data);
    return response.data;
};

export const verifyOTP = async (
    email: string,
    otp: string,
    options?: { isShortcutRegistration?: boolean; tempPassword?: string }
): Promise<void> => {
    await post<ApiResponse<void>>('/auth/verify-otp', {
        email,
        otp,
        ...(options?.isShortcutRegistration ? {
            isShortcutRegistration: true,
            tempPassword: options.tempPassword,
        } : {}),
    });
};

export const resendOTP = async (email: string): Promise<void> => {
    await post<ApiResponse<void>>('/auth/resend-otp', { email });
};

export const getCurrentUser = async (): Promise<User> => {
    const response = await get<ApiResponse<User>>('/auth/me');
    return response.data;
};

export const forgotPassword = async (email: string): Promise<void> => {
    await post<ApiResponse<void>>('/auth/forgot-password', { email });
};

export const resetPassword = async (token: string, password: string): Promise<void> => {
    await post<ApiResponse<void>>('/auth/reset-password', { token, password });
};

export const logout = async (): Promise<void> => {
    await post<ApiResponse<void>>('/auth/logout', {});
};

export const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await put<ApiResponse<void>>('/users/change-password', { currentPassword, newPassword });
};

export const updateProfile = async (data: Partial<User>): Promise<void> => {
    const payload: Record<string, unknown> = { ...data };

    if (Object.prototype.hasOwnProperty.call(payload, 'broker_area')) {
        payload.brokerArea = payload.broker_area;
        delete payload.broker_area;
    }

    if (Object.prototype.hasOwnProperty.call(payload, 'contact_visibility')) {
        payload.contactVisibility = payload.contact_visibility;
        delete payload.contact_visibility;
    }

    await put<ApiResponse<void>>('/users/profile', payload);
};

export const uploadProfileImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('image', file);
    const response = await post<ApiResponse<{ imageUrl: string }>>('/users/profile-image', formData);
    return response.data.imageUrl;
};

export const toggle2FA = async (): Promise<{ twoFactorEnabled: boolean }> => {
    const response = await put<ApiResponse<{ twoFactorEnabled: boolean }>>('/users/toggle-2fa', {});
    return response.data;
};
