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

const normalizeUser = (rawUser: unknown): User => {
    const source = (rawUser || {}) as Record<string, unknown>;

    return {
        id: Number(source.id ?? source.userId ?? 0),
        unique_id: String(source.unique_id ?? source.uniqueId ?? ''),
        name: String(source.name ?? ''),
        email: String(source.email ?? ''),
        contact: String(source.contact ?? ''),
        gender: (source.gender as User['gender']) || 'Other',
        pincode: String(source.pincode ?? ''),
        role: (source.role as User['role']) || 'Member',
        broker_area: source.broker_area ? String(source.broker_area) : undefined,
        broker_status: (source.broker_status ?? source.brokerStatus) as User['broker_status'],
        profile_image: source.profile_image ? String(source.profile_image) : undefined,
        two_factor_enabled: Boolean(source.two_factor_enabled),
        is_verified: Boolean(source.is_verified ?? true),
        registration_date: String(source.registration_date ?? ''),
        last_login: source.last_login ? String(source.last_login) : undefined,
        status: (source.status as User['status']) || 'Active',
        contact_visibility: (source.contact_visibility as User['contact_visibility']) || 'Private'
    };
};

export const login = async (data: LoginFormData): Promise<LoginResponse> => {
    const response = await post<ApiResponse<LoginResponse>>('/auth/login', data);
    return {
        ...response.data,
        user: normalizeUser(response.data.user)
    };
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
    return normalizeUser(response.data);
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
