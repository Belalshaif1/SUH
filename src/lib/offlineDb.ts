/**
 * @file src/lib/offlineDb.ts
 * @description Defines the client-side IndexedDB schema using Dexie.js.
 *              Provides offline caching and a mutation sync queue so the app
 *              can function without a network connection.
 */

import Dexie, { Table } from 'dexie'; // Import Dexie — a wrapper that makes IndexedDB usable

// ─── SyncItem Interface ────────────────────────────────────────────────────

/**
 * Defines the shape of a queued mutation stored locally when offline.
 * When the user goes back online, each item is replayed against the server.
 */
export interface SyncItem {
    id?: number;                          // Auto-incremented primary key assigned by Dexie
    table: string;                        // The API resource name (e.g. 'universities', 'jobs')
    action: 'create' | 'update' | 'delete'; // The operation that was attempted offline
    data: any;                            // The full payload that should be sent to the server
    timestamp: number;                    // Unix ms timestamp — used to process items in order
}

// ─── Database Class ────────────────────────────────────────────────────────

/**
 * SmartUniversityDB — the application's offline database.
 * Each public property corresponds to a cached table in IndexedDB.
 */
export class SmartUniversityDB extends Dexie {
    universities!: Table<any>;                   // Cached universities list
    colleges!: Table<any>;                       // Cached colleges list
    departments!: Table<any>;                    // Cached departments list
    announcements!: Table<any>;                  // Cached announcements list
    research!: Table<any>;                       // Cached research papers list
    graduates!: Table<any>;                      // Cached graduates list
    jobs!: Table<any>;                           // Cached jobs list
    fees!: Table<any>;                           // Cached fees list
    services!: Table<any>;                       // Cached services list
    about_us!: Table<any>;                       // Cached about_us list
    sync_queue!: Table<SyncItem>;                // Queue of mutations to replay when online
    meta!: Table<{ key: string; value: any }>;  // Key/value store for misc metadata

    constructor() {
        super('SmartUniversityDB'); // The string is the IndexedDB database name in the browser

        // Define schema version 1 — the string value is a comma-separated list of indexed fields
        // The first field in each string is the primary key; '++id' means auto-increment
        this.version(2).stores({
            universities:  'id, name_ar, is_pinned',            
            colleges:      'id, university_id, name_ar, is_pinned', 
            departments:   'id, college_id, name_ar',           
            announcements: 'id, university_id, college_id, is_pinned', 
            research:      'id, department_id, title_ar',       
            graduates:     'id, department_id, graduation_year', 
            jobs:          'id, college_id, is_pinned',         
            fees:          'id, department_id, fee_type',
            services:      'id, title_ar',
            about_us:      'id',
            sync_queue:    '++id, table, action',               
            meta:          'key',                               
        });
    }
}

// ─── Singleton Instance ────────────────────────────────────────────────────

/** Single shared instance of the database — import `db` everywhere instead of creating new ones */
export const db = new SmartUniversityDB();

// ─── Helper: Add to Sync Queue ────────────────────────────────────────────

/**
 * Stores an offline mutation in the sync queue so it can be replayed later.
 * Called by `apiClient` automatically when a mutation fails due to no network.
 */
export const addToSyncQueue = async (
    table: string,                              // The API resource name (e.g. 'graduates')
    action: 'create' | 'update' | 'delete',    // The type of mutation that was attempted
    data: any                                   // The full request payload to replay
): Promise<void> => {
    await db.sync_queue.add({  // Insert a new record into the local sync queue table
        table,                 // Which API resource to target when replaying
        action,                // Which HTTP verb to use when replaying
        data,                  // The body payload to send to the server
        timestamp: Date.now(), // Record the current time so items are replayed in order
    });
};

// ─── Helper: Process Sync Queue ───────────────────────────────────────────

/**
 * Replays all queued offline mutations against the live server.
 * Called automatically when the user comes back online (via 'online' event in apiClient).
 * Each item is deleted from the queue only after a successful server response.
 * Failures are logged but do NOT halt the loop — remaining items still get processed.
 */
export const processSyncQueue = async (apiClient: Function): Promise<void> => {
    // Fetch all queued mutations sorted from oldest to newest for correct replay order
    const queue = await db.sync_queue.orderBy('timestamp').toArray();

    if (queue.length === 0) return; // Nothing to sync — exit early

    console.log(`[SyncQueue] Starting background sync for ${queue.length} pending items`);

    for (const item of queue) { // Iterate through each pending mutation one at a time
        try {
            // Build the API endpoint path from the table name and optionally the item's id
            let endpoint = `/${item.table}`;

            // For updates and deletes, append the record's id to target the specific resource
            let method = 'POST'; // Default to POST for new record creation
            if (item.action === 'update') {
                method = 'PUT';                   // Use PUT for modifying an existing record
                endpoint += `/${item.data.id}`;   // Append the id so the server knows which record to update
            } else if (item.action === 'delete') {
                method = 'DELETE';                // Use DELETE for removing a record
                endpoint += `/${item.data.id}`;   // Append the id so the server knows which record to delete
            }

            // Send the replay request to the live server
            await apiClient(endpoint, {
                method,                               // The HTTP verb determined above
                body: JSON.stringify(item.data),      // The original payload serialized to JSON
                skipQueueOnFail: true,                // Prevent re-queueing if this replay also fails (avoids infinite loop)
            });

            // Only delete the queue item AFTER the server confirms success
            if (item.id !== undefined) {
                await db.sync_queue.delete(item.id); // Remove from queue to prevent double-execution
            }
        } catch (err) {
            // Log the failure but continue processing the rest of the queue
            // The failed item stays in the queue and will be retried on the next 'online' event
            console.error('[SyncQueue] Failed to sync item:', { item, error: err });
        }
    }
};
