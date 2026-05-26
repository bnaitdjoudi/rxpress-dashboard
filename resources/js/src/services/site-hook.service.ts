import fetchApi from './api';

export interface SiteHookData {
    id: number;
    site_id: number;
    hook_id: number;
    hook: string;
    label: string | null;
    category: string | null;
    active: boolean;
    created_at: string;
}

export const siteHookApi = {
    getAll: async (siteId: number): Promise<SiteHookData[]> => {
        return fetchApi(`/sites/${siteId}/hooks`);
    },

    addById: async (siteId: number, hookId: number): Promise<SiteHookData> => {
        return fetchApi(`/sites/${siteId}/hooks`, {
            method: 'POST',
            body: JSON.stringify({ hook_id: hookId }),
        });
    },

    addCustom: async (siteId: number, hook: string): Promise<SiteHookData> => {
        return fetchApi(`/sites/${siteId}/hooks`, {
            method: 'POST',
            body: JSON.stringify({ hook }),
        });
    },

    toggle: async (siteId: number, siteHookId: number, active: boolean): Promise<SiteHookData> => {
        return fetchApi(`/sites/${siteId}/hooks/${siteHookId}`, {
            method: 'PUT',
            body: JSON.stringify({ active }),
        });
    },

    remove: async (siteId: number, siteHookId: number): Promise<void> => {
        return fetchApi(`/sites/${siteId}/hooks/${siteHookId}`, {
            method: 'DELETE',
        });
    },
};

export default siteHookApi;
