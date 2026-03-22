/**
 * @file src/hooks/useSync.ts
 * @description Manages background data synchronisation between the local IndexedDB
 *              cache and the remote server. Handles both push (offline mutations)
 *              and pull (updating stale cached data) operations.
 *              Automatically triggers a sync when the device comes back online.
 */

import { useEffect, useState, useCallback } from 'react'; // React hooks for state and side effects
import { db }        from '@/lib/offlineDb'; // The local Dexie IndexedDB instance
import apiClient     from '@/lib/apiClient'; // Central HTTP client with auth headers
import { useToast }  from './use-toast';     // Toast notification hook for user feedback

// ─── Hook ─────────────────────────────────────────────────────────────────

/**
 * useSync — attaches a background synchronisation engine to the component it's used in.
 * Should be called once at the app layout level so sync persists across all pages.
 *
 * @returns {object} isSyncing flag, lastSync timestamp, and manual sync trigger
 */
export const useSync = () => {
    const { toast } = useToast(); // Access toast so we can notify the user after a successful sync

    const [isSyncing, setIsSyncing] = useState(false); // True while a push/pull cycle is in progress
    const [lastSync, setLastSync]   = useState<number>(0); // Unix ms timestamp of the last successful sync

    // ─── Pull Updates ────────────────────────────────────────────────────

    /**
     * pullUpdates — fetches any server-side changes that occurred after the last sync.
     * Uses the lastSyncTime stored in localStorage as a cursor so we only get new records.
     * Updates the local IndexedDB tables with the received data.
     */
    const pullUpdates = useCallback(async (): Promise<void> => {
        try {
            // Read the last successful sync timestamp from persistent storage
            const lastSyncTime = parseInt(localStorage.getItem('lastSyncTime') || '0');

            // Request only records changed after lastSyncTime from the server
            const updates = await apiClient('/sync/pull', {
                params: { lastSync: lastSyncTime.toString() }, // Pass cursor as a query parameter
            });

            // Only update the local cache if the server returned new data
            if (updates && updates.length > 0) {
                for (const update of updates) {
                    // 'put' inserts or updates the record in the given IndexedDB table
                    await db.table(update.table).put(update.data);
                }

                const newSyncTime = Date.now(); // Record when this successful pull completed
                localStorage.setItem('lastSyncTime', newSyncTime.toString()); // Persist the new cursor
                setLastSync(newSyncTime); // Update React state so consumers can show 'last synced' info
            }
        } catch (error) {
            // Log the failure but do not throw — the app should continue working offline
            console.error('[useSync] Pull failed:', error);
        }
    }, []); // No external dependencies — safe to memoize once

    // ─── Push Mutations ──────────────────────────────────────────────────

    /**
     * pushMutations — sends any queued offline mutations to the server.
     * If the push succeeds, the local sync_queue table is cleared.
     * Shows a toast notification on completion.
     */
    const pushMutations = useCallback(async (): Promise<void> => {
        const mutations = await db.sync_queue.toArray(); // Read all pending offline mutations

        if (mutations.length === 0) return; // Nothing to push — exit early to avoid unnecessary requests

        try {
            setIsSyncing(true); // Show a syncing indicator while the push request is in flight

            // Send all queued mutations to the server in a single batch request
            const result = await apiClient('/sync/push', {
                method: 'POST',
                body: JSON.stringify({ mutations }), // Serialise the mutation array to JSON
            });

            if (result.success) {
                await db.sync_queue.clear(); // Clear the queue now that the server acknowledged all mutations
                toast({
                    title: 'Sync Complete',                             // Success toast title
                    description: 'All offline changes have been saved.', // Inform the user that offline actions were applied
                });
            }
        } catch (error) {
            // Log the failure — the queue remains so a retry happens next time online
            console.error('[useSync] Push failed:', error);
        } finally {
            setIsSyncing(false); // Always clear the syncing flag, even on failure
        }
    }, [toast]); // Recreate only if the toast function changes (it never should)

    // ─── Combined Sync ───────────────────────────────────────────────────

    /**
     * sync — runs a full push-then-pull cycle.
     * Guard: only runs when the device has an active internet connection.
     */
    const sync = useCallback(async (): Promise<void> => {
        if (!navigator.onLine) return; // Skip entirely if the device is offline
        await pushMutations();         // First push pending local mutations to the server
        await pullUpdates();           // Then pull any new server-side changes
    }, [pushMutations, pullUpdates]); // Recreate only if the sub-functions change

    // ─── Auto-Sync Setup ─────────────────────────────────────────────────

    useEffect(() => {
        // Handler called when the device returns to an online state
        const handleOnline = () => {
            sync(); // Trigger an immediate sync when connectivity is restored
        };

        window.addEventListener('online', handleOnline); // Attach the online event listener

        sync(); // Run an initial sync when the component first mounts

        // Periodic pull every 5 minutes to keep cached data reasonably fresh
        const interval = setInterval(pullUpdates, 5 * 60 * 1000);

        // Cleanup: remove listeners and cancel the interval when the component unmounts
        return () => {
            window.removeEventListener('online', handleOnline); // Avoid memory leaks
            clearInterval(interval);                            // Stop the periodic pulls
        };
    }, [sync, pullUpdates]); // Re-run only if sync/pullUpdates references change

    // ─── Return Public API ────────────────────────────────────────────────

    return {
        isSyncing, // True while a sync cycle is actively running
        lastSync,  // Unix ms timestamp of the last completed pull
        sync,      // Manual sync trigger — call this to force a sync immediately
    };
};
