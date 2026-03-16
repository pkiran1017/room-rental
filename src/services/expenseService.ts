import { get, post, put, del } from './api';
import type { ApiResponse, Expense } from '@/types';

interface ExpenseResponse {
    data: Expense[];
}

export interface ExpenseSplitInput {
    roommateId?: number;
    amount?: number;
    name?: string;
    email?: string;
    contact?: string;
    city?: string;
}

export interface CreateExpensePayload {
    title: string;
    cost: number;
    expenseDate: string;
    expenseCategory?: 'Daily' | 'TripOther';
    tripLabel?: string;
    paidBy?: number;
    groupId?: string;
    splitType?: 'Equal' | 'Custom';
    dueDate?: string;
    notes?: string;
    splits: ExpenseSplitInput[];
}

export const getExpenses = async (filters?: { groupId?: string; month?: number; year?: number; page?: number; limit?: number }): Promise<ExpenseResponse> => {
    const params = new URLSearchParams();
    
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });
    }

    const response = await get<ApiResponse<Expense[]>>(`/expenses?${params}`);
    return { data: response.data };
};

export const getExpenseById = async (expenseId: string): Promise<Expense> => {
    const response = await get<ApiResponse<Expense>>(`/expenses/${expenseId}`);
    return response.data;
};

export const createExpense = async (data: CreateExpensePayload): Promise<{ expenseId: string }> => {
    const response = await post<ApiResponse<{ expenseId: string }>>('/expenses', data);
    return response.data;
};

export const updateExpense = async (expenseId: string, data: Partial<Expense>): Promise<void> => {
    await put<ApiResponse<void>>(`/expenses/${expenseId}`, data as Partial<Expense> & {
        splits?: Array<{ splitId?: number; roommateId: number; amount: number }>;
    });
};

export const getGroupSettlementSummary = async (
    groupId: string,
    roommateId: number
): Promise<{
    roommateId: number;
    name: string;
    email?: string;
    contact?: string;
    totalSpent: number;
    totalMembers: number;
    equalShare: number;
    alreadyPaid: number;
    dueAmount: number;
    expenseLines: Array<{ title: string; amount: number; paidBy: string }>;
    message: string;
    whatsappLink?: string | null;
}> => {
    const response = await get<ApiResponse<any>>(`/expenses/groups/${groupId}/members/${roommateId}/settlement-summary`);
    return response.data;
};

export const sendGroupSettlementReminder = async (
    groupId: string,
    roommateId: number,
    options?: {
        adminUpiId?: string;
        adminScannerUrl?: string;
        adminDriveLink?: string;
    }
): Promise<{
    name: string;
    email?: string;
    contact?: string;
    dueAmount: number;
    message: string;
    whatsappLink?: string | null;
    emailSent?: boolean;
}> => {
    const response = await post<ApiResponse<any>>(`/expenses/groups/${groupId}/members/${roommateId}/remind`, {
        adminUpiId: options?.adminUpiId,
        adminScannerUrl: options?.adminScannerUrl,
        adminDriveLink: options?.adminDriveLink,
    });
    return response.data;
};

export const deleteExpense = async (expenseId: string): Promise<void> => {
    await del<ApiResponse<void>>(`/expenses/${expenseId}`);
};

export const markSplitAsPaid = async (expenseId: string, splitId: number): Promise<void> => {
    await put<ApiResponse<void>>(`/expenses/${expenseId}/splits/${splitId}/pay`, {});
};

export const updateExpenseSettlementStatus = async (expenseId: string, isSettled: boolean): Promise<void> => {
    await put<ApiResponse<void>>(`/expenses/${expenseId}/status`, { isSettled });
};

export const sendPaymentReminder = async (expenseId: string, splitId: number): Promise<{ 
    name: string; 
    email: string; 
    contact?: string; 
    whatsappLink?: string 
}> => {
    const response = await post<ApiResponse<{ name: string; email: string; contact?: string; whatsappLink?: string }>>(
        `/expenses/${expenseId}/remind`, 
        { splitId }
    );
    return response.data;
};

export const getExpenseStats = async (filters?: { groupId?: string; year?: number; month?: number }): Promise<{
    summary: {
        total_expenses: number;
        total_amount: number;
        settled_amount: number;
        pending_amount: number;
    };
    monthly: { month: number; year: number; expense_count: number; total_amount: number }[];
    byCategory: { title: string; count: number; total: number }[];
}> => {
    const params = new URLSearchParams();
    
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });
    }

    const response = await get<ApiResponse<any>>(`/expenses/stats/summary?${params}`);
    return response.data;
};
