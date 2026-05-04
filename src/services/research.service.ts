/**
 * @file src/services/research.service.ts
 * @description Service layer for research papers API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface Research {
    id: string;
    department_id: string;
    title_ar: string;
    title_en?: string;
    abstract_ar?: string;
    abstract_en?: string;
    author_name: string;
    published?: number;
    publish_date?: string | null;
    pdf_url?: string | null;
    students?: unknown[];
    departments?: unknown | null;
}

export const ResearchService = {
    getAll: (filters?: { department_id?: string; college_id?: string; university_id?: string }) =>
        apiGet<Research[]>('/research', filters ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string> : undefined),

    create: (data: Partial<Research>) =>
        apiPost<{ id: string }>('/research', data),

    update: (id: string, data: Partial<Research>) =>
        apiPut<{ success: boolean }>(`/research/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/research/${id}`),
};
