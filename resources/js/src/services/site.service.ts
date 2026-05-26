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

export interface WcApiKey {
    key_id: number;
    user_id: number;
    user_login: string;
    display_name: string;
    roles: string[];
    description: string;
    permissions: 'read' | 'write' | 'read_write';
    truncated_key: string;
    last_access: string | null;
}

export interface WcApiKeyCreated extends WcApiKey {
    consumer_key: string;
    consumer_secret: string;
}

export const siteApi = {
    getAll: async (): Promise<SiteData[]> => {
        return fetchApi('/sites');
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

    regenerateDbPassword: async (id: number): Promise<{ db_pass: string }> => {
        return fetchApi(`/sites/${id}/db-password/regenerate`, {
            method: 'POST',
        });
    },

    regenerateWpPassword: async (id: number): Promise<{ wp_admin_pass: string }> => {
        return fetchApi(`/sites/${id}/wp-password/regenerate`, {
            method: 'POST',
        });
    },

    listWcApiKeys: async (id: number): Promise<WcApiKey[]> => {
        return fetchApi(`/sites/${id}/wc-keys`);
    },

    createWcApiKey: async (id: number, data: { user_id: number; description: string; permissions: string }): Promise<WcApiKeyCreated> => {
        return fetchApi(`/sites/${id}/wc-keys`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    deleteWcApiKey: async (id: number, keyId: number): Promise<void> => {
        return fetchApi(`/sites/${id}/wc-keys/${keyId}`, {
            method: 'DELETE',
        });
    },

    regenerateWcApiKey: async (id: number, keyId: number): Promise<WcApiKeyCreated> => {
        return fetchApi(`/sites/${id}/wc-keys/${keyId}/regenerate`, {
            method: 'POST',
        });
    },
};

export default siteApi;
