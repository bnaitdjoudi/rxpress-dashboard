import fetchApi from './api';

export interface PlanData {
    id: number;
    nom: string;
    description: string;
    active: boolean;
    grade: number;
    prices: PriceData[];
}

export interface PriceData {
    id: number;
    nom: string;
    montant: string;
    devise: string;
    period: string;
    frequence: string;
    active: boolean;
}

export const planApi = {
    getAll: async (): Promise<PlanData[]> => {
        return fetchApi('/plans');
    },
    getUpgrades: async (minGrade: number): Promise<PlanData[]> => {
        return fetchApi(`/plans?min_grade=${minGrade}`);
    },
};

export const priceApi = {
    getAll: async (): Promise<PriceData[]> => {
        return fetchApi('/prices');
    },
};
