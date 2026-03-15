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

// دالة لإضافة العمليات إلى طابور المزامنة
export const addToSyncQueue = async (table: string, action: 'create' | 'update' | 'delete', data: any) => {
    // إضافة العملية إلى قاعدة البيانات المحلية مع تسجيل الوقت
    await db.sync_queue.add({
        table,
        action,
        data,
        timestamp: Date.now()
    });
};

// دالة لمعالجة طابور المزامنة عند عودة الاتصال
export const processSyncQueue = async (apiClient: any) => {
    // جلب جميع العمليات المتوقفة للحظات الانقطاع
    const queue = await db.sync_queue.orderBy('timestamp').toArray();
    if (queue.length === 0) return; // لا يوجد شيء للمزامنة

    console.log(`Starting background sync for ${queue.length} items...`);
    
    // محاولة معالجة كل عملية مسجلة
    for (const item of queue) {
        try {
            // تحديد الرابط والطريقة بناءً على الإجراء
            let endpoint = `/${item.table}`;
            let method = 'POST';
            if (item.action === 'update') {
                method = 'PUT';
                endpoint += `/${item.data.id}`;
            } else if (item.action === 'delete') {
                method = 'DELETE';
                endpoint += `/${item.data.id}`;
            }

            // تنفيذ الطلب عبر apiClient (يجب إعداد apiClient لتجنب حلقة لا نهائية)
            await apiClient(endpoint, {
                method,
                body: JSON.stringify(item.data),
                skipQueueOnFail: true, // لتجنب إعادة الإضافة إن فشل
            });

            // حذف العنصر من الطابور بعد نجاح إرساله لعدم تكرار الإرسال
            if (item.id) await db.sync_queue.delete(item.id);
        } catch (err) {
            console.error('Failed to sync item', item, err);
            // سيحتفظ بالعنصر في الطابور للمحاولة لاحقاً
        }
    }
};
