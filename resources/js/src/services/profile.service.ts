import fetchApi from './api';

export interface ProfileData {
    id: number;
    user_id: number;
    phone: string | null;
    avatar: string | null;
    bio: string | null;
    address: string | null;
    city: string | null;
    country: string | null;
    postal_code: string | null;
    company: string | null;
    website: string | null;
}

export interface UserWithProfile {
    id: number;
    name: string;
    email: string;
    hestia_user: string | null;
    profile: ProfileData | null;
}

export interface ProfileUpdatePayload {
    name?: string;
    email?: string;
    password?: string;
    password_confirmation?: string;
    phone?: string;
    avatar?: string;
    bio?: string;
    address?: string;
    city?: string;
    country?: string;
    postal_code?: string;
    company?: string;
    website?: string;
}

export const profileApi = {
    get: async (): Promise<UserWithProfile> => {
        return fetchApi('/profile');
    },

    update: async (data: ProfileUpdatePayload): Promise<UserWithProfile> => {
        return fetchApi('/profile', {
            method: 'PUT',
            body: JSON.stringify(data),
        });
    },

    setHestiaPassword: async (password: string, password_confirmation: string): Promise<{ message: string }> => {
        return fetchApi('/profile/hestia-password', {
            method: 'POST',
            body: JSON.stringify({ password, password_confirmation }),
        });
    },
};

export default profileApi;
