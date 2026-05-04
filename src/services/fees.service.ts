/**
 * @file src/services/fees.service.ts
 * @description Service layer for university fees API calls.
 */

import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

export interface Fee {
    id: string;
    department_id: string;
    fee_type: string;
    amount: number;
    currency: string;
    academic_year: string;
    departments?: unknown | null;
}

export const FeesService = {
    getAll: () =>
        apiGet<Fee[]>('/fees'),

    create: (data: Partial<Fee>) =>
        apiPost<{ id: string }>('/fees', data),

    update: (id: string, data: Partial<Fee>) =>
        apiPut<{ success: boolean }>(`/fees/${id}`, data),

    remove: (id: string) =>
        apiDelete<{ success: boolean }>(`/fees/${id}`),
};
