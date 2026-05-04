/**
 * @file src/services/api.service.ts
 * @description Base API service helper that wraps the central apiClient.
 *              Provides typed convenience methods (get, post, put, patch, delete)
 *              to avoid repeating fetch options and JSON.stringify() in every
 *              entity service file.
 */

import apiClient from '@/lib/apiClient';

// ─── Typed wrappers ───────────────────────────────────────────────────────────

/**
 * Perform a GET request.
 * @template T  Expected response type
 */
export const apiGet = <T>(
    endpoint: string,
    params?: Record<string, string>
): Promise<T> => apiClient(endpoint, { params });

/**
 * Perform a POST request with a JSON body.
 * @template T  Expected response type
 */
export const apiPost = <T>(endpoint: string, body: unknown): Promise<T> =>
    apiClient(endpoint, {
        method : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
    });

/**
 * Perform a PUT request with a JSON body.
 * @template T  Expected response type
 */
export const apiPut = <T>(endpoint: string, body: unknown): Promise<T> =>
    apiClient(endpoint, {
        method : 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
    });

/**
 * Perform a PATCH request with a JSON body.
 * @template T  Expected response type
 */
export const apiPatch = <T>(endpoint: string, body: unknown): Promise<T> =>
    apiClient(endpoint, {
        method : 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body   : JSON.stringify(body),
    });

/**
 * Perform a DELETE request.
 * @template T  Expected response type
 */
export const apiDelete = <T>(endpoint: string): Promise<T> =>
    apiClient(endpoint, { method: 'DELETE' });
