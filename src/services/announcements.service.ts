/**
 * @file src/services/announcements.service.ts
 * @description Service layer for announcements API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface Announcement {
    id: string;
    title_ar: string;
    title_en?: string;
    content_ar: string;
    content_en?: string;
    scope?: string;
    university_id?: string | null;
    college_id?: string | null;
    image_url?: string | null;
    file_url?: string | null;
    is_pinned?: number;
    created_by?: string;
    created_at?: string;
    universities?: { name_ar: string; name_en: string; logo_url?: string } | null;
    colleges?: { name_ar: string; name_en: string; logo_url?: string } | null;
}

export const AnnouncementsService = {
    getAll: (limit?: number) =>
        apiGet<Announcement[]>('/announcements', limit ? { limit: limit.toString() } : undefined),

    getById: (id: string) =>
        apiGet<Announcement>(`/announcements/${id}`),

    create: (data: Partial<Announcement>) =>
        apiPost<{ id: string }>('/announcements', data),

    update: (id: string, data: Partial<Announcement>) =>
        apiPut<{ success: boolean }>(`/announcements/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/announcements/${id}`),
};
