import { useEffect, useState } from 'react';
import { db } from '@/lib/offlineDb';
import apiClient from '@/lib/apiClient';
import { useToast } from './use-toast';

export const useSync = () => {
    const { toast } = useToast();
    const [isSyncing, setIsSyncing] = useState(false);
    const [lastSync, setLastSync] = useState<number>(0);

    const pullUpdates = async () => {
        try {
            const lastSyncTime = parseInt(localStorage.getItem('lastSyncTime') || '0');
            const updates = await apiClient('/sync/pull', { params: { lastSync: lastSyncTime.toString() } });

            if (updates && updates.length > 0) {
                for (const update of updates) {
                    await db.table(update.table).put(update.data);
                }
                const newSyncTime = Date.now();
                localStorage.setItem('lastSyncTime', newSyncTime.toString());
                setLastSync(newSyncTime);
            }
        } catch (error) {
            console.error('Pull sync failed:', error);
        }
    };

    const pushMutations = async () => {
        const mutations = await db.sync_queue.toArray();
        if (mutations.length === 0) return;

        try {
            setIsSyncing(true);
            const result = await apiClient('/sync/push', {
                method: 'POST',
                body: JSON.stringify({ mutations })
            });

            if (result.success) {
                await db.sync_queue.clear();
                toast({ title: "Sync Complete", description: "All offline changes have been saved." });
            }
        } catch (error) {
            console.error('Push sync failed:', error);
        } finally {
            setIsSyncing(false);
        }
    };

    const sync = async () => {
        if (!navigator.onLine) return;
        await pushMutations();
        await pullUpdates();
    };

    useEffect(() => {
        const handleOnline = () => {
            sync();
        };

        window.addEventListener('online', handleOnline);

        // Initial sync
        sync();

        // Periodic pull (every 5 minutes)
        const interval = setInterval(pullUpdates, 5 * 60 * 1000);

        return () => {
            window.removeEventListener('online', handleOnline);
            clearInterval(interval);
        };
    }, []);

    return { isSyncing, lastSync, sync };
};
