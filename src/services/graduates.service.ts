/**
 * @file src/services/graduates.service.ts
 * @description Service layer for graduates API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface Graduate {
    id: string;
    department_id: string;
    full_name_ar: string;
    full_name_en?: string;
    graduation_year: number;
    gpa?: number | null;
    specialization_ar?: string;
    specialization_en?: string;
    departments?: unknown | null;
    created_at?: string;
    updated_at?: string;
    [key: string]: any;
}

export const GraduatesService = {
    getAll: (filters?: { department_id?: string; college_id?: string; university_id?: string }) =>
        apiGet<Graduate[]>('/graduates', filters ? Object.fromEntries(Object.entries(filters).filter(([, v]) => v)) as Record<string, string> : undefined),

    create: (data: Partial<Graduate>) =>
        apiPost<{ id: string }>('/graduates', data),

    update: (id: string, data: Partial<Graduate>) =>
        apiPut<{ success: boolean }>(`/graduates/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/graduates/${id}`),
};
