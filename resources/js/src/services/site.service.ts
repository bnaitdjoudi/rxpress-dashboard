import fetchApi from './api';

export interface SiteData {
    id: number;
    nom: string;
    nom_de_domaine: string;
    stat: 'active' | 'inactive' | 'maintenance';
    storage: string;
    created_at: string;
    updated_at: string;
    subscription: { id: number; start_date: string; renewal_date: string; status: string } | null;
    mq_credential: { id: number; host: string; port: number; vhost: string; queue: string; username: string } | null;
}

export const siteApi = {
    getAll: async (): Promise<SiteData[]> => {
        return fetchApi('/sites');
    },

    create: async (data: { nom: string; nom_de_domaine: string }): Promise<SiteData & { api_key: string }> => {
        return fetchApi('/sites', {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    getOne: async (id: number): Promise<SiteData> => {
        return fetchApi(`/sites/${id}`);
    },

    update: async (id: number, data: { nom: string; nom_de_domaine: string }): Promise<SiteData> => {
        return fetchApi(`/sites/${id}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    getMqPassword: async (id: number): Promise<{ password: string }> => {
        return fetchApi(`/sites/${id}/mq-password`);
    },

    toggleStat: async (id: number, stat: 'active' | 'inactive'): Promise<SiteData> => {
        return fetchApi(`/sites/${id}/stat`, {
            method: 'PATCH',
            body: JSON.stringify({ stat }),
        });
    },

    regenerateMqPassword: async (id: number): Promise<{ password: string }> => {
        return fetchApi(`/sites/${id}/mq-password/regenerate`, {
            method: 'POST',
        });
    },
};

export default siteApi;
