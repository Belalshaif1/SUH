/**
 * @file src/services/colleges.service.ts
 * @description Service layer for college API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface College {
    id: string;
    university_id: string;
    name_ar: string;
    name_en: string;
    description_ar?: string;
    description_en?: string;
    guide_pdf_url?: string;
    logo_url?: string;
    is_pinned?: number;
    universities?: { name_ar: string; name_en: string } | null;
}

export const CollegesService = {
    getAll: (universityId?: string) =>
        apiGet<College[]>('/colleges', universityId ? { university_id: universityId } : undefined),

    getById: (id: string) =>
        apiGet<College>(`/colleges/${id}`),

    create: (data: Partial<College>) =>
        apiPost<{ id: string }>('/colleges', data),

    update: (id: string, data: Partial<College>) =>
        apiPut<{ success: boolean }>(`/colleges/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/colleges/${id}`),
};
