import fetchApi from './api';

export const paymentApi = {
    createCheckoutSession: async (data: {
        plan_id: number;
        price_id: number;
        prorata_credit?: number;
    }): Promise<{ url: string }> => {
        return fetchApi('/stripe/checkout', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },
};
