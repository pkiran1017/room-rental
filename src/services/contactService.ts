import { post } from './api';

export interface ContactFormPayload {
    name: string;
    email: string;
    phone?: string;
    subject: string;
    message: string;
    website?: string;
    sourcePage?: string;
    formElapsedMs?: number;
}

export const submitContactForm = async (payload: ContactFormPayload): Promise<string> => {
    const response = await post<{ success: boolean; message: string }>('/public/contact', payload);
    return response.message || 'Thank you for contacting us. We will get back to you soon.';
};