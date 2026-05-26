import fetchApi from './api';

export interface WpEventData {
    id: number;
    event_id: string | null;
    hook: string;
    site_url: string;
    compte: string | null;
    user_id: number;
    args: string[];
    wp_timestamp: string | null;
    created_at: string;
}

export interface WpEventPaginated {
    data: WpEventData[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
}

export interface WpEventStats {
    total: number;
    by_hook: { hook: string; count: number }[];
    by_site: { site_url: string; count: number }[];
    per_hour: { hour: string; count: number }[];
}

export interface WpEventFilters {
    hook?: string;
    site_urls?: string;
    from?: string;
    to?: string;
    page?: number;
    per_page?: number;
}

const wpEventApi = {
    getAll: async (filters: WpEventFilters = {}): Promise<WpEventPaginated> => {
        const params = new URLSearchParams();
        Object.entries(filters).forEach(([k, v]) => v !== undefined && v !== '' && params.append(k, String(v)));
        return fetchApi(`/wp-events?${params.toString()}`);
    },

    getStats: async (): Promise<WpEventStats> => {
        return fetchApi('/wp-events/stats');
    },
};

export default wpEventApi;
