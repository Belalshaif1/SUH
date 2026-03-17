import Dexie, { Table } from 'dexie'; // استيراد مكتبة Dexie للتعامل مع قاعدة بيانات المتصفح IndexedDB

// تعريف واجهة (Interface) لعنصر المزامنة لتحديد شكل البيانات المخزنة في الطابور
export interface SyncItem { 
    id?: number; // معرف تلقائي الزيادة للعنصر في طابور المزامنة
    table: string; // اسم الجدول المتأثر بالعملية (مثل universities)
    action: 'create' | 'update' | 'delete'; // نوع العملية (إضافة، تحديث، حذف)
    data: any; // البيانات الفعلية المراد إرسالها للخادم
    timestamp: number; // وقت تسجيل العملية لضمان ترتيب التنفيذ
}

// تعريف فئة قاعدة بيانات التطبيق الذكي (SmartUniversityDB) ووراثة خصائص Dexie
export class SmartUniversityDB extends Dexie { 
    universities!: Table<any>; // جدول الجامعات
    colleges!: Table<any>; // جدول الكليات
    departments!: Table<any>; // جدول الأقسام
    announcements!: Table<any>; // جدول الإعلانات
    research!: Table<any>; // جدول الأبحاث
    graduates!: Table<any>; // جدول الخريجين
    jobs!: Table<any>; // جدول الوظائف
    sync_queue!: Table<SyncItem>; // جدول طابور المزامنة للعمليات التي تتم بدون إنترنت
    meta!: Table<{ key: string, value: any }>; // جدول لتخزين بيانات وصفية إضافية

    constructor() { 
        super('SmartUniversityDB'); // تسمية قاعدة البيانات المحلية
        // تحديد إصدار قاعدة البيانات وهيكل الجداول والفهارس (Indexes)
        this.version(1).stores({ 
            universities: 'id, name_ar, is_pinned', // الفهرسة حسب المعرف والاسم والحالة المثبتة
            colleges: 'id, university_id, name_ar, is_pinned', 
            departments: 'id, college_id, name_ar', 
            announcements: 'id, university_id, college_id, is_pinned', 
            research: 'id, department_id, title_ar', 
            graduates: 'id, department_id, graduation_year', 
            jobs: 'id, college_id, is_pinned', 
            sync_queue: '++id, table, action', // ++id تعني معرف تلقائي الزيادة
            meta: 'key' 
        });
    }
}

// إنشاء نسخة واحدة (Instance) من قاعدة البيانات وتصديرها للاستخدام
export const db = new SmartUniversityDB(); 

// دالة مساعدة لإضافة العمليات التي تمت في وضع "بدون إنترنت" إلى طابور المزامنة
export const addToSyncQueue = async (table: string, action: 'create' | 'update' | 'delete', data: any) => { 
    // إضافة الإجراء المكتمل محلياً إلى جدول المزامنة مع تسجيل الوقت الحالي
    await db.sync_queue.add({ 
        table, 
        action, 
        data, 
        timestamp: Date.now() 
    });
};

// دالة لمعالجة وإرسال العمليات المخزنة في طابور المزامنة عند استعادة الاتصال بالإنترنت
export const processSyncQueue = async (apiClient: any) => { 
    // جلب جميع العمليات من الطابور وترتيبها حسب وقت الحدوث (الأقدم أولاً)
    const queue = await db.sync_queue.orderBy('timestamp').toArray(); 
    if (queue.length === 0) return; // الخروج إذا كان الطابور فارغاً

    console.log(`Starting background sync for ${queue.length} items...`); // تسجيل بدء عملية المزامنة
    
    // التكرار عبر كل عنصر في الطابور لمحاولة إرساله للخادم
    for (const item of queue) { 
        try { 
            // تحديد المسار الفرعي (Endpoint) وطريقة الإرسال (Method) بناءً على بيانات العنصر
            let endpoint = `/${item.table}`; 
            let method = 'POST'; // الطريقة الافتراضية للإضافة
            if (item.action === 'update') { 
                method = 'PUT'; // التحديث يستخدم طريقة PUT
                endpoint += `/${item.data.id}`; // إضافة معرف العنصر للمسار
            } else if (item.action === 'delete') { 
                method = 'DELETE'; // الحذف يستخدم طريقة DELETE
                endpoint += `/${item.data.id}`; // إضافة معرف العنصر للمسار
            }

            // تنفيذ الطلب الفعلي للخادم باستخدام عميل الـ API
            await apiClient(endpoint, { 
                method, 
                body: JSON.stringify(item.data), // تحويل البيانات لنص JSON
                skipQueueOnFail: true, // تفعيل هذا الخيار لمنع إعادة إضافة الطلب للطابور في حال فشل الاتصال مجدداً
            });

            // في حال نجاح الإرسال، يتم حذف العملية من الطابور المحلي لضمان عدم تكرارها
            if (item.id) await db.sync_queue.delete(item.id); 
        } catch (err) { 
            // تسجيل الخطأ في حال فشل مزامنة عنصر معين؛ سيظل العنصر في الطابور للمحاولة لاحقاً
            console.error('Failed to sync item', item, err); 
        }
    }
};
