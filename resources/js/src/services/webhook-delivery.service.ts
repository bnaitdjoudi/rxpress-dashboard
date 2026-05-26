import fetchApi from './api';

export interface WebhookDeliveryData {
    id: number;
    webhook_id: number;
    endpoint_url: string;
    status: 'success' | 'failed' | 'skipped';
    http_status_code: number | null;
    attempts: number;
    duration_ms: number | null;
    error_message: string | null;
    created_at: string;
    webhook?: { id: number; name: string; endpoint_url: string; site?: { id: number; nom: string; nom_de_domaine: string } };
}

export interface WebhookDeliveryPaginated {
    data: WebhookDeliveryData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface WebhookDeliveryStats {
    total: number;
    success: number;
    failed: number;
    skipped: number;
    avg_duration: number;
    by_webhook: { webhook_id: number; status: string; count: number; webhook?: { id: number; name: string } }[];
    per_hour: { hour: string; status: string; count: number }[];
}

export interface WebhookDeliveryFilters {
    status?: 'success' | 'failed' | 'skipped' | '';
    webhook_ids?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

const webhookDeliveryApi = {
    getAll: async (filters: WebhookDeliveryFilters = {}): Promise<WebhookDeliveryPaginated> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v !== undefined && v !== '' && params.append(k, String(v)));
        return fetchApi(`/webhook-deliveries?${params.toString()}`);
    },

    getStats: async (): Promise<WebhookDeliveryStats> => {
        return fetchApi('/webhook-deliveries/stats');
    },

    replay: async (id: number): Promise<{ queued: boolean; delivery_id: number }> => {
        return fetchApi(`/webhook-deliveries/${id}/replay`, { method: 'POST' });
    },
};

export default webhookDeliveryApi;
