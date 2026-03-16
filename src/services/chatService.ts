import { get, post, put } from './api';
import type { ApiResponse, ChatRoom, Message, User } from '@/types';

// Get user's chat rooms
export const getChatRooms = async (): Promise<ChatRoom[]> => {
    const response = await get<ApiResponse<ChatRoom[]>>('/chat/rooms');
    return response.data;
};

// Get or create chat room for a listing
export const getOrCreateChatRoom = async (roomListingId: number, receiverId?: number): Promise<ChatRoom> => {
    const response = await post<ApiResponse<ChatRoom>>('/chat/room', { 
        roomListingId,
        receiverId
    });
    return response.data;
};

// Get chat messages
export const getChatMessages = async (
    chatId: string,
    limit = 100,
    offset = 0
): Promise<Message[]> => {
    const response = await get<ApiResponse<Message[]>>(
        `/chat/room/${chatId}/messages?limit=${limit}&offset=${offset}`
    );
    return response.data;
};

// Send message
export const sendMessage = async (chatId: string, message: string): Promise<Message> => {
    const response = await post<ApiResponse<Message>>(
        `/chat/room/${chatId}/message`,
        { message }
    );
    return response.data;
};

// Mark messages as read
export const markMessagesAsRead = async (chatId: string): Promise<void> => {
    await put<ApiResponse<void>>(`/chat/room/${chatId}/read`, {});
};

// Get unread message count
export const getUnreadCount = async (): Promise<{ unreadCount: number }> => {
    const response = await get<ApiResponse<{ unreadCount: number }>>('/chat/unread-count');
    return response.data;
};

// Start chat for a room
export const startChat = async (roomId: string): Promise<{ success: boolean; chatId: number; redirectUrl: string }> => {
    const response = await post<any>('/chat/start', { roomId });
    return response;
};

// Auto register for chat (for non-registered users)
export const autoRegisterForChat = async (email: string, roomId: string): Promise<{
    exists: boolean;
    user?: any;
    userId?: number;
    uniqueId?: string;
    requiresVerification?: boolean;
    message: string;
}> => {
    const response = await post<ApiResponse<any>>('/chat/auto-register', { email, roomId });
    return response.data;
};

// Search messages in a chat
export const searchMessages = async (
    chatId: string,
    query: string,
    limit = 20
): Promise<Message[]> => {
    const response = await get<ApiResponse<Message[]>>(
        `/chat/messages/${chatId}/search?q=${query}&limit=${limit}`
    );
    return response.data;
};

// Delete a message
export const deleteMessage = async (messageId: string): Promise<{ success: boolean }> => {
    const response = await post<ApiResponse<{ success: boolean }>>(`/chat/message/${messageId}/delete`, {});
    return response;
};

// Archive chat
export const archiveChat = async (chatId: string): Promise<{ success: boolean }> => {
    const response = await put<ApiResponse<{ success: boolean }>>(`/chat/${chatId}/archive`, {});
    return response;
};

// Star/unstar a chat
export const starChat = async (chatRoomId: string): Promise<ChatRoom> => {
    const response = await post<ApiResponse<ChatRoom>>(`/chat/${chatRoomId}/star`, {});
    return response.data;
};

// Unstar a chat
export const unstarChat = async (chatRoomId: string): Promise<ChatRoom> => {
    const response = await post<ApiResponse<ChatRoom>>(`/chat/${chatRoomId}/unstar`, {});
    return response.data;
};

// Get unread counts for all chat rooms
export const getUnreadCountsPerRoom = async (): Promise<Record<string, number>> => {
    const response = await get<ApiResponse<Record<string, number>>>('/chat/unread-per-room');
    return response.data;
};

// Get user contact info for chat
export const getUserContactInfo = async (userId: number): Promise<Pick<User, 'id' | 'name' | 'contact' | 'contact_visibility' | 'profile_image'>> => {
    const response = await get<ApiResponse<Pick<User, 'id' | 'name' | 'contact' | 'contact_visibility' | 'profile_image'>>>(`/users/contact/${userId}`);
    return response.data;
};

// Update user contact visibility
export const updateContactVisibility = async (visibility: 'Private' | 'Public'): Promise<{ contact_visibility: 'Private' | 'Public' }> => {
    const response = await put<ApiResponse<{ contact_visibility: 'Private' | 'Public' }>>('/users/contact-visibility', { visibility });
    return response.data;
};

// Get current user's profile with contact visibility
export const getCurrentUserProfile = async (): Promise<Pick<User, 'id' | 'name' | 'contact' | 'contact_visibility'>> => {
    const response = await get<ApiResponse<User>>('/users/profile');
    const user = response.data;
    return {
        id: user.id,
        name: user.name,
        contact: user.contact,
        contact_visibility: user.contact_visibility || 'Private'
    };
};

// Get room contact info for chat
export const getRoomContactInfo = async (roomId: string | number): Promise<{
    id: number;
    room_id: string;
    title: string;
    contact: string;
    contact_visibility: 'Private' | 'Public';
    user_id: number;
    owner_name: string;
    owner_image?: string;
}> => {
    const response = await get<ApiResponse<{
        id: number;
        room_id: string;
        title: string;
        contact: string;
        contact_visibility: 'Private' | 'Public';
        user_id: number;
        owner_name: string;
        owner_image?: string;
    }>>(`/rooms/${roomId}/contact`);
    return response.data;
};

// Update room contact visibility
export const updateRoomContactVisibility = async (
    roomId: string | number,
    visibility: 'Private' | 'Public'
): Promise<{ contact_visibility: 'Private' | 'Public'; room_id: string }> => {
    const response = await put<ApiResponse<{ contact_visibility: 'Private' | 'Public'; room_id: string }>>(
        `/rooms/${roomId}/contact-visibility`,
        { visibility }
    );
    return response.data;
};
