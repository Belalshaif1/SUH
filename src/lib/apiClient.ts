import { db, addToSyncQueue } from './offlineDb';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

interface RequestOptions extends RequestInit {
    params?: Record<string, string>;
    skipCache?: boolean;
}

const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
    const { params, skipCache, ...customConfig } = options;
    const token = localStorage.getItem('token');
    const method = customConfig.method || 'GET';

    const headers: Record<string, string> = {
        ...(customConfig.headers as Record<string, string>),
    };

    if (!(customConfig.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    let url = `${API_URL}${endpoint}`;
    if (params) {
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    // Offline Detection & Caching Logic
    const tableName = endpoint.replace(/^\//, '').split('/')[0];
    const isSupportedTable = ['universities', 'colleges', 'departments', 'announcements', 'research', 'graduates', 'jobs'].includes(tableName);

    if (method === 'GET' && isSupportedTable && !skipCache) {
        try {
            // Check cache first if offline or slow? 
            // For now, let's try fetch and fallback to cache
            const response = await fetch(url, config);
            if (response.ok) {
                const data = await response.json();
                // Update local cache
                if (Array.isArray(data) && !params) {
                    await db.table(tableName).clear();
                    await db.table(tableName).bulkAdd(data);
                }
                return data;
            }
        } catch (error) {
            console.warn('Network error, attempting to serve from cache:', endpoint);
            const cachedData = await db.table(tableName).toArray();
            if (cachedData.length > 0) return cachedData;
            throw error;
        }
    }

    try {
        const response = await fetch(url, config);
        const data = await response.json();

        if (response.ok) {
            return data;
        } else {
            const isAr = localStorage.getItem('language') === 'ar';
            const genericMsg = isAr ? 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' : 'An unexpected error occurred, please try again later';
            const serverMsg = data.error || genericMsg;

            if (endpoint !== '/error_logs') {
                try {
                    fetch(`${API_URL}/error_logs`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            message: serverMsg,
                            stack_trace: `Status: ${response.status}`,
                            source: 'frontend_apiClient',
                            user_id: localStorage.getItem('token') ? 'authenticated' : 'anonymous'
                        })
                    }).catch(() => { });
                } catch (e) { }
            }

            if (response.status >= 500) {
                throw new Error(genericMsg);
            }
            throw new Error(serverMsg);
        }
    } catch (error: any) {
        // If it's a mutation and we're offline, queue it!
        if (method !== 'GET' && isSupportedTable && (error.message.includes('Failed to fetch') || !navigator.onLine)) {
            console.log('Offline: Queuing mutation for', endpoint);
            await addToSyncQueue(tableName, method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update', JSON.parse(customConfig.body as string || '{}'));
            return { message: 'Action queued for sync', offline: true };
        }

        if (endpoint !== '/error_logs') {
            try {
                fetch(`${API_URL}/error_logs`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        message: error.message || 'Unknown network error',
                        stack_trace: error.stack || '',
                        source: 'frontend_network',
                        user_id: localStorage.getItem('token') ? 'authenticated' : 'anonymous'
                    })
                }).catch(() => { });
            } catch (e) { }
        }
        console.error('API Error:', error.message);
        throw error;
    }
};

export default apiClient;
