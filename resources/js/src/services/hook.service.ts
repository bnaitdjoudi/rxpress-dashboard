import fetchApi from './api';

export interface HookData {
    id: number;
    hook: string;
    label: string | null;
    category: string | null;
    origine: 'proprietaire' | 'externe';
}

export interface HookCategory {
    category: string;
    hooks: HookData[];
}

export const hookApi = {
    getListed: async (): Promise<HookData[]> => {
        return fetchApi('/hooks');
    },

    getMine: async (): Promise<HookData[]> => {
        return fetchApi('/hooks/mine');
    },

    groupByCategory: (hooks: HookData[]): HookCategory[] => {
        const map = new Map<string, HookData[]>();
        for (const h of hooks) {
            const cat = h.category ?? 'Autres';
            if (!map.has(cat)) map.set(cat, []);
            map.get(cat)!.push(h);
        }
        return Array.from(map.entries()).map(([category, hooks]) => ({ category, hooks }));
    },
};

export default hookApi;
