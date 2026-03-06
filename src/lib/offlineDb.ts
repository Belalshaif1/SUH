import Dexie, { Table } from 'dexie';

export interface SyncItem {
    id?: number;
    table: string;
    action: 'create' | 'update' | 'delete';
    data: any;
    timestamp: number;
}

export class SmartUniversityDB extends Dexie {
    universities!: Table<any>;
    colleges!: Table<any>;
    departments!: Table<any>;
    announcements!: Table<any>;
    research!: Table<any>;
    graduates!: Table<any>;
    jobs!: Table<any>;
    sync_queue!: Table<SyncItem>;
    meta!: Table<{ key: string, value: any }>;

    constructor() {
        super('SmartUniversityDB');
        this.version(1).stores({
            universities: 'id, name_ar, is_pinned',
            colleges: 'id, university_id, name_ar, is_pinned',
            departments: 'id, college_id, name_ar',
            announcements: 'id, university_id, college_id, is_pinned',
            research: 'id, department_id, title_ar',
            graduates: 'id, department_id, graduation_year',
            jobs: 'id, college_id, is_pinned',
            sync_queue: '++id, table, action',
            meta: 'key'
        });
    }
}

export const db = new SmartUniversityDB();

export const addToSyncQueue = async (table: string, action: 'create' | 'update' | 'delete', data: any) => {
    await db.sync_queue.add({
        table,
        action,
        data,
        timestamp: Date.now()
    });
};
