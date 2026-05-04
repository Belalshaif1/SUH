/**
 * @file src/services/departments.service.ts
 * @description Service layer for department API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface Department {
    id: string;
    college_id: string;
    name_ar: string;
    name_en: string;
    description_ar?: string;
    description_en?: string;
    study_plan_url?: string;
    logo_url?: string;
    colleges?: { name_ar: string; name_en: string } | null;
}

export const DepartmentsService = {
    getAll: (collegeId?: string) =>
        apiGet<Department[]>('/departments', collegeId ? { college_id: collegeId } : undefined),

    getById: (id: string) =>
        apiGet<Department>(`/departments/${id}`),

    create: (data: Partial<Department>) =>
        apiPost<{ id: string }>('/departments', data),

    update: (id: string, data: Partial<Department>) =>
        apiPut<{ success: boolean }>(`/departments/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/departments/${id}`),
};
