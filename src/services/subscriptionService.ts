import api from './api';
import type { Subscription, BrokerSubscriptionStats, Plan } from '@/types';

// Get broker's current subscription details
export const getBrokerSubscription = async (): Promise<BrokerSubscriptionStats> => {
    const response = await api.get<BrokerSubscriptionStats>('/subscriptions/broker/current');
    return response.data;
};

// Get all subscription history for a broker
export const getSubscriptionHistory = async (): Promise<Subscription[]> => {
    const response = await api.get<Subscription[]>('/subscriptions/broker/history');
    return response.data;
};

// Get available plans for brokers
export const getAvailablePlans = async (planType: 'Regular' | 'Broker' = 'Broker'): Promise<Plan[]> => {
    const response = await api.get<Plan[]>(`/subscriptions/plans?type=${planType}`);
    return response.data;
};

// Create a new subscription (purchase/renew)
export const createSubscription = async (planId: number): Promise<{ subscription: Subscription; message: string }> => {
    const response = await api.post('/subscriptions/broker/renew', { plan_id: planId });
    return response.data;
};

// Initiate payment for subscription
export const initiatePayment = async (subscriptionId: number): Promise<{ paymentUrl: string; orderId: string }> => {
    const response = await api.post('/subscriptions/payment/initiate', { subscription_id: subscriptionId });
    return response.data;
};

// Verify payment status
export const verifyPayment = async (orderId: string, paymentId: string): Promise<{ success: boolean; message: string }> => {
    const response = await api.post('/subscriptions/payment/verify', { order_id: orderId, payment_id: paymentId });
    return response.data;
};
