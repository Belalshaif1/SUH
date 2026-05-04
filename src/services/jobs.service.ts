/**
 * @file src/services/jobs.service.ts
 * @description Service layer for jobs and job applications API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface Job {
    id: string;
    college_id?: string;
    title_ar: string;
    title_en?: string;
    description_ar?: string;
    description_en?: string;
    requirements_ar?: string;
    requirements_en?: string;
    is_active?: number;
    is_pinned?: number;
    deadline?: string | null;
    colleges?: { name_ar: string; name_en: string } | null;
    universities?: { name_ar: string; name_en: string } | null;
}

export const JobsService = {
    getAll: () =>
        apiGet<Job[]>('/jobs'),

    create: (data: Partial<Job>) =>
        apiPost<{ id: string }>('/jobs', data),

    update: (id: string, data: Partial<Job>) =>
        apiPut<{ success: boolean }>(`/jobs/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/jobs/${id}`),

    // ── Job Applications ──────────────────────────────────────────────────

    getApplicationsForJob: (jobId: string) =>
        apiGet<unknown[]>(`/job_applications/job/${jobId}`),

    apply: (data: { job_id: string; file_url: string }) =>
        apiPost<{ id: string; success: boolean }>('/job_applications', data),

    updateApplicationStatus: (appId: string, status: 'accepted' | 'rejected' | 'pending') =>
        apiPut<{ success: boolean }>(`/job_applications/${appId}/status`, { status }),
};
