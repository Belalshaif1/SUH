/**
 * @file src/services/services.service.ts
 * @description Service for fetching university electronic services.
 */
import { apiGet, apiPost, apiPut, apiDelete } from './api.service';

const ENDPOINT = '/services';

export const ServicesService = {
  /**
   * Fetch all electronic services.
   */
  getAll: async () => {
    return apiGet(ENDPOINT);
  },

  /**
   * Fetch a specific service by ID.
   */
  getById: async (id: string) => {
    return apiGet(`${ENDPOINT}/${id}`);
  },

  /**
   * Create a new service.
   */
  create: async (data: any) => {
    return apiPost(ENDPOINT, data);
  },

  /**
   * Update an existing service.
   */
  update: async (id: string, data: any) => {
    return apiPut(`${ENDPOINT}/${id}`, data);
  },

  /**
   * Delete a service.
   */
  delete: async (id: string) => {
    return apiDelete(`${ENDPOINT}/${id}`);
  }
};
