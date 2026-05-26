import fetchApi from './api';

export interface PriceData {
    id: number;
    nom: string;
    montant: string;
    devise: string;
    period: string;
    frequence: string;
    active: boolean;
}

export interface PlanData {
    id: number;
    nom: string;
    description: string;
    active: boolean;
    grade: number;
}

export interface UsageData {
    used: number;
    limit: number;
    unit: string;
}

export interface SubscriptionData {
    id: number;
    plan_id: number;
    start_date: string;
    renewal_date: string;
    status: 'active' | 'expired' | 'cancelled';
    billing: string;
    plan: PlanData | null;
    price: PriceData | null;
    storage: UsageData | null;
    bandwidth: UsageData | null;
    visits: UsageData | null;
    hooks: UsageData | null;
    sites: UsageData | null;
    webhooks: UsageData | null;
}

export const subscriptionApi = {
    get: async (): Promise<SubscriptionData | null> => {
        return fetchApi('/subscriptions');
    },
};
