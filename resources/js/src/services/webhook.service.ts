import fetchApi from './api';

export interface WebhookData {
    id: number;
    site_id: number;
    name: string | null;
    endpoint_url: string;
    auth_type: string;
    content_type: string;
    has_auth: boolean;
    events_count: number;
    active: boolean;
    consecutive_failures: number;
    auto_disabled_at: string | null;
    last_called_at: string | null;
    last_status_code: number | null;
    created_at: string;
}

export interface WebhookEventData {
    id: number;
    webhook_id: number;
    hook: string;
    active: boolean;
    created_at: string;
}

export interface WebhookCreatePayload {
    name?: string;
    endpoint_url: string;
    auth_type: string;
    auth_config?: Record<string, string>;
    content_type?: string;
    active?: boolean;
}

export interface WebhookUpdatePayload {
    name?: string;
    endpoint_url?: string;
    auth_type?: string;
    auth_config?: Record<string, string>;
    content_type?: string;
    active?: boolean;
}

export const AUTH_TYPES = [
    { value: 'none', label: 'Aucune authentification' },
    { value: 'application_password', label: 'Application Password (WordPress)' },
    { value: 'basic_auth', label: 'Basic Auth' },
    { value: 'bearer_token', label: 'Bearer Token' },
    { value: 'api_key', label: 'API Key (Header)' },
    { value: 'oauth2', label: 'OAuth 2.0' },
] as const;

export interface AuthField {
    key: string;
    label: string;
    type: 'text' | 'password' | 'url' | 'select';
    placeholder: string;
    options?: { value: string; label: string }[];
    dependsOn?: { key: string; value: string };
}

export const AUTH_TYPE_FIELDS: Record<string, AuthField[]> = {
    none: [],
    application_password: [
        { key: 'username', label: 'Nom d\'utilisateur WordPress', type: 'text', placeholder: 'admin' },
        { key: 'app_password', label: 'Application Password', type: 'password', placeholder: 'xxxx xxxx xxxx xxxx xxxx xxxx' },
    ],
    basic_auth: [
        { key: 'username', label: 'Nom d\'utilisateur', type: 'text', placeholder: 'username' },
        { key: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
    ],
    bearer_token: [
        { key: 'token', label: 'Token', type: 'password', placeholder: 'eyJhbGciOiJIUzI1NiIs...' },
    ],
    api_key: [
        { key: 'header_name', label: 'Nom du header', type: 'text', placeholder: 'X-API-Key' },
        { key: 'api_key', label: 'Clé API', type: 'password', placeholder: 'votre-clé-api' },
    ],
    oauth2: [
        {
            key: 'grant_type',
            label: 'Grant Type',
            type: 'select',
            placeholder: '',
            options: [
                { value: 'client_credentials', label: 'Client Credentials (machine-to-machine)' },
                { value: 'password', label: 'Resource Owner Password' },
            ],
        },
        { key: 'token_url', label: 'URL du token', type: 'url', placeholder: 'https://example.com/oauth/token' },
        { key: 'client_id', label: 'Client ID', type: 'text', placeholder: 'client_id' },
        { key: 'client_secret', label: 'Client Secret', type: 'password', placeholder: 'client_secret' },
        { key: 'username', label: 'Username', type: 'text', placeholder: 'username', dependsOn: { key: 'grant_type', value: 'password' } },
        { key: 'password', label: 'Password', type: 'password', placeholder: '••••••••', dependsOn: { key: 'grant_type', value: 'password' } },
    ],
};

export const webhookApi = {
    getAll: async (siteId: number): Promise<WebhookData[]> => {
        return fetchApi(`/sites/${siteId}/webhooks`);
    },

    create: async (siteId: number, data: WebhookCreatePayload): Promise<{ webhook: WebhookData; secret: string }> => {
        return fetchApi(`/sites/${siteId}/webhooks`, {
            method: 'POST',
            body: JSON.stringify(data),
        });
    },

    update: async (siteId: number, webhookId: number, data: WebhookUpdatePayload): Promise<WebhookData> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}`, {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    regenerateSecret: async (siteId: number, webhookId: number): Promise<{ secret: string }> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}/regenerate-secret`, {
            method: 'POST',
        });
    },

    delete: async (siteId: number, webhookId: number): Promise<void> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}`, {
            method: 'DELETE',
        });
    },

    // Webhook Events
    getEvents: async (siteId: number, webhookId: number): Promise<WebhookEventData[]> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}/events`);
    },

    addEvent: async (siteId: number, webhookId: number, hook: string): Promise<WebhookEventData> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}/events`, {
            method: 'POST',
            body: JSON.stringify({ hook }),
        });
    },

    toggleEvent: async (siteId: number, webhookId: number, eventId: number, active: boolean): Promise<WebhookEventData> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}/events/${eventId}`, {
            method: 'PUT',
            body: JSON.stringify({ active }),
        });
    },

    removeEvent: async (siteId: number, webhookId: number, eventId: number): Promise<void> => {
        return fetchApi(`/sites/${siteId}/webhooks/${webhookId}/events/${eventId}`, {
            method: 'DELETE',
        });
    },
};

export const WP_HOOK_CATEGORIES: { category: string; hooks: { value: string; label: string }[] }[] = [
    {
        category: 'Posts',
        hooks: [
            { value: 'publish_post', label: 'Publication d\'un article' },
            { value: 'save_post', label: 'Sauvegarde d\'un article' },
            { value: 'delete_post', label: 'Suppression d\'un article' },
            { value: 'transition_post_status', label: 'Changement de statut d\'un article' },
            { value: 'wp_trash_post', label: 'Mise à la corbeille' },
        ],
    },
    {
        category: 'Pages',
        hooks: [
            { value: 'publish_page', label: 'Publication d\'une page' },
            { value: 'save_page', label: 'Sauvegarde d\'une page' },
            { value: 'delete_page', label: 'Suppression d\'une page' },
        ],
    },
    {
        category: 'Commentaires',
        hooks: [
            { value: 'comment_post', label: 'Nouveau commentaire' },
            { value: 'edit_comment', label: 'Modification d\'un commentaire' },
            { value: 'delete_comment', label: 'Suppression d\'un commentaire' },
            { value: 'wp_set_comment_status', label: 'Changement de statut d\'un commentaire' },
        ],
    },
    {
        category: 'Utilisateurs',
        hooks: [
            { value: 'user_register', label: 'Inscription d\'un utilisateur' },
            { value: 'profile_update', label: 'Mise à jour du profil' },
            { value: 'delete_user', label: 'Suppression d\'un utilisateur' },
            { value: 'wp_login', label: 'Connexion' },
            { value: 'wp_logout', label: 'Déconnexion' },
        ],
    },
    {
        category: 'Médias',
        hooks: [
            { value: 'add_attachment', label: 'Upload d\'un média' },
            { value: 'edit_attachment', label: 'Modification d\'un média' },
            { value: 'delete_attachment', label: 'Suppression d\'un média' },
        ],
    },
    {
        category: 'Taxonomies',
        hooks: [
            { value: 'created_term', label: 'Création d\'un terme' },
            { value: 'edited_term', label: 'Modification d\'un terme' },
            { value: 'delete_term', label: 'Suppression d\'un terme' },
        ],
    },
    {
        category: 'WooCommerce',
        hooks: [
            { value: 'woocommerce_new_order', label: 'Nouvelle commande' },
            { value: 'woocommerce_order_status_changed', label: 'Changement de statut de commande' },
            { value: 'woocommerce_payment_complete', label: 'Paiement complété' },
            { value: 'woocommerce_new_product', label: 'Nouveau produit' },
            { value: 'woocommerce_update_product', label: 'Mise à jour produit' },
            { value: 'woocommerce_created_customer', label: 'Nouveau client' },
        ],
    },
];

export default webhookApi;
