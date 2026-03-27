/**
 * @file src/lib/apiClient.ts
 * @description The central HTTP client for all server communication.
 *              Handles authentication headers, offline caching (IndexedDB),
 *              sync queue for mutations made while offline, and error logging.
 *
 * Design decisions:
 *  - GET requests for supported tables automatically populate the IndexedDB cache.
 *  - If a GET fails (no network), the client silently falls back to cached data.
 *  - Failed mutations (POST/PUT/DELETE) while offline are queued and replayed later.
 *  - All server errors are automatically logged to /api/error_logs for analysis.
 */

import { db, addToSyncQueue, processSyncQueue } from './offlineDb'; // IndexedDB helpers

// ─── Base URL ─────────────────────────────────────────────────────────────

/** The API base URL. Reads from the Vite env or falls back to localhost for development */
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ─── Type Extensions ──────────────────────────────────────────────────────

/** Extends the standard browser RequestInit with custom options */
interface RequestOptions extends RequestInit {
    params?: Record<string, string>; // Optional URL query string parameters (e.g. { page: '1' })
    skipCache?: boolean;             // Set true to bypass the IndexedDB cache on GET requests
    skipQueueOnFail?: boolean;       // Set true to prevent re-queueing when a request fails (avoids replay loops)
}

// ─── Supported Offline Tables ─────────────────────────────────────────────

/** Tables whose GET responses are cached locally and whose mutations are queued offline */
const OFFLINE_SUPPORTED_TABLES = [
    'universities', 'colleges', 'departments',
    'announcements', 'research', 'graduates', 'jobs',
    'fees', 'services', 'about_us'
];

// ─── Core Client Function ─────────────────────────────────────────────────

/**
 * apiClient — the single fetch wrapper used throughout the application.
 * Attach auth headers, handle errors, cache responses, and queue offline mutations.
 *
 * @param endpoint - API path relative to API_URL (e.g. '/universities', '/graduates/123')
 * @param options  - Any standard RequestInit options plus our custom extensions
 * @returns Parsed JSON body of a successful response, or throws an Error
 */
const apiClient = async (endpoint: string, options: RequestOptions = {}): Promise<any> => {
    // Destructure our custom options so they don't leak into the native fetch() call
    const { params, skipCache, skipQueueOnFail, ...fetchConfig } = options;

    // Read the JWT from localStorage — set during login, cleared on logout
    const token = localStorage.getItem('token');

    // Determine the HTTP method — defaults to GET if not specified
    const method = fetchConfig.method || 'GET';

    // ── Build Headers ──────────────────────────────────────────────────

    const headers: Record<string, string> = {
        ...(fetchConfig.headers as Record<string, string>), // Spread any caller-provided headers
    };

    // Only set Content-Type to JSON when the body is NOT a FormData (file upload)
    // For FormData, the browser must set the boundary itself — we must not override it
    if (!(fetchConfig.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json'; // Tell the server we're sending JSON
    }

    // Attach the JWT as a Bearer token if we have one stored
    if (token) {
        headers['Authorization'] = `Bearer ${token}`; // Standard auth header format
    }

    // ── Build URL ──────────────────────────────────────────────────────

    let url = `${API_URL}${endpoint}`; // Concatenate base URL with the specific endpoint path

    if (params) {
        // Convert the params object to a query string (e.g. { page: '1' } → '?page=1')
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`; // Append the query string to the URL
    }

    // ── Final Fetch Config ─────────────────────────────────────────────

    const config: RequestInit = {
        ...fetchConfig, // Include all standard fetch options (method, body, signal, etc.)
        headers,        // Overwrite headers with our merged set
    };

    // ── Extract table name from the endpoint for cache/queue routing ───

    // Strip leading slash, then take the first path segment (e.g. '/graduates/123' → 'graduates')
    const tableName = endpoint.replace(/^\//, '').split('/')[0];

    // Check if this table is one we support for offline caching and mutation queuing
    const isSupportedTable = OFFLINE_SUPPORTED_TABLES.includes(tableName);

    // ── GET with Cache Fallback ────────────────────────────────────────

    if (method === 'GET' && isSupportedTable && !skipCache) {
        try {
            const response = await fetch(url, config);     // Attempt a live network request
            if (response.ok) {
                const data = await response.json();         // Parse the JSON response body

                // Only cache simple list responses (not filtered queries with params)
                if (Array.isArray(data) && !params) {
                    await db.table(tableName).clear();      // Remove stale cached records
                    await db.table(tableName).bulkAdd(data); // Replace with fresh data from server
                }

                return data; // Return fresh data to the caller
            }
        } catch {
            // Network is unavailable — fall through to serve cached data
            console.warn(`[apiClient] Network unavailable for ${endpoint} — serving cached data`);

            const cachedData = await db.table(tableName).toArray(); // Read from IndexedDB
            if (cachedData.length > 0) {
                return cachedData; // Return the cached data instead of failing
            }
            throw new Error('No network and no cached data available'); // Nothing we can do
        }
    }

    // ── POST / PUT / DELETE ────────────────────────────────────────────

    try {
        const response = await fetch(url, config); // Send the mutation request to the server

        // Attempt to parse the response as JSON (most API responses are JSON)
        const data = await response.json();

        if (response.ok) {
            return data; // Success — return the parsed response body
        }

        // ── Server returned a 4xx or 5xx error response ────────────────

        const isArabic   = localStorage.getItem('language') === 'ar'; // Check user's language pref
        const genericMsg = isArabic
            ? 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً'
            : 'An unexpected error occurred, please try again later';

        // Use the server's error message if available, otherwise use the generic fallback
        const serverMsg = data.error || genericMsg;

        // Silently log the error to the server for developer analysis (fire-and-forget)
        if (endpoint !== '/error_logs') { // Guard: don't log errors from the logging endpoint itself
            fetch(`${API_URL}/error_logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message:     serverMsg,                              // The human-readable error
                    stack_trace: `HTTP ${response.status}`,             // Status code as context
                    source:      'frontend_apiClient',                  // Identifies this as a frontend-origin error
                    user_id:     token ? 'authenticated' : 'anonymous', // Rough user identification
                }),
            }).catch(() => {}); // Ignore if the logging request itself fails
        }

        // For 5xx server errors, throw a safe generic message (don't leak internal details)
        if (response.status >= 500) {
            throw new Error(genericMsg);
        }

        // For 4xx client errors, throw the specific message from the server
        throw new Error(serverMsg);

    } catch (error: any) {

        // ── Offline mutation queuing ────────────────────────────────────

        // If a non-GET mutation failed because we're offline, queue it for later replay
        const isOfflineError = error.message?.includes('Failed to fetch') || !navigator.onLine;

        if (method !== 'GET' && isSupportedTable && !skipQueueOnFail && isOfflineError) {
            console.log(`[apiClient] Offline: queuing ${method} ${endpoint} for later`);

            // Parse the JSON body back to an object so we can store it in the queue
            const bodyData = fetchConfig.body instanceof FormData
                ? {}  // File uploads can't be queued — skip them
                : JSON.parse((fetchConfig.body as string) || '{}');

            // Map HTTP verb to the sync queue action type
            const action = method === 'POST' ? 'create'
                         : method === 'DELETE' ? 'delete'
                         : 'update';

            await addToSyncQueue(tableName, action, bodyData); // Store in IndexedDB queue

            return { message: 'Action queued for sync when online', offline: true }; // Signal to caller
        }

        // ── Network error logging ──────────────────────────────────────

        // Log genuine network failures (not offline queuing) to the server for analysis
        if (endpoint !== '/error_logs' && !skipQueueOnFail) {
            fetch(`${API_URL}/error_logs`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message:     error.message || 'Unknown network error', // The error message
                    stack_trace: error.stack   || '',                       // Full JS stack trace
                    source:      'frontend_network',                        // Origin category
                    user_id:     token ? 'authenticated' : 'anonymous',    // Rough identification
                }),
            }).catch(() => {}); // Fire-and-forget — don't throw if logging itself fails
        }

        console.error('[apiClient] Error:', error.message); // Log to browser console for debugging
        throw error; // Re-throw so the calling hook/component can handle it (show toast, etc.)
    }
};

// ─── Auto-Sync on Reconnect ───────────────────────────────────────────────

// Attach a global listener so queued offline mutations are replayed when connectivity returns
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        // When the browser goes back online, replay all pending sync queue items
        processSyncQueue(apiClient).catch(console.error); // Ignore errors to prevent unhandled rejections
    });
}

// ─── Media URL Helper ─────────────────────────────────────────────────────

/**
 * getMediaUrl — converts a relative server file path to a full URL.
 * Handles null/undefined gracefully by returning an empty string.
 *
 * @param path - A relative path like '/uploads/image.png' or a full 'https://...' URL
 * @returns A fully-qualified URL string safe for use in <img src> or <a href>
 */
export const getMediaUrl = (path: string | null | undefined): string => {
    if (!path) return ''; // Null/undefined paths return empty string to avoid broken images

    if (path.startsWith('http')) return path; // Already a full URL — return as-is

    // Strip '/api' from the end of the base URL — uploads are served at the root server path
    const baseUrl = API_URL.replace(/\/api$/, '');

    // Ensure there's exactly one '/' between the base URL and the path
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// Export the client as the default export so it can be imported with any name
export default apiClient;
