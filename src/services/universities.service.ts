/**
 * @file src/services/universities.service.ts
 * @description Service layer for university API calls.
 *              All components and hooks should go through this service
 *              instead of calling apiClient directly, to centralise endpoint paths.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface University {
    id: string;
    name_ar: string;
    name_en: string;
    description_ar?: string;
    description_en?: string;
    guide_pdf_url?: string;
    logo_url?: string;
    is_pinned?: number;
    created_at?: string;
    updated_at?: string;
}

export const UniversitiesService = {
    /** Fetch all universities */
    getAll: (sort?: string) =>
        apiGet<University[]>('/universities', sort ? { sort } : undefined),

    /** Fetch a single university by ID */
    getById: (id: string) =>
        apiGet<University>(`/universities/${id}`),

    /** Create a new university */
    create: (data: Partial<University>) =>
        apiPost<{ id: string }>('/universities', data),

    /** Update an existing university */
    update: (id: string, data: Partial<University>) =>
        apiPut<{ success: boolean }>(`/universities/${id}`, data),

    /** Permanently delete a university */
    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/universities/${id}`),
};
