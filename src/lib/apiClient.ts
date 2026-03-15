// استيراد قاعدة البيانات المحلية ودوال المزامنة
import { db, addToSyncQueue, processSyncQueue } from './offlineDb';

// مسار الخادم الأساسي يتم جلبه من المتغيرات البيئية أو مسار افتراضي
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// واجهة تعريف خصائص الطلب المتوقعة
interface RequestOptions extends RequestInit {
    params?: Record<string, string>; // معاملات البحث (Query Params)
    skipCache?: boolean; // خيار لتخطي الذاكرة المخبأة
    skipQueueOnFail?: boolean; // منع إدخال الطلب في الطابور عند الفشل (لتجنب حلقة لا نهائية عند المزامنة)
}

// إنشاء عميل الشبكة العام
const apiClient = async (endpoint: string, options: RequestOptions = {}) => {
    // فصل الخصائص المخصصة عن الخصائص القياسية للطلب
    const { params, skipCache, skipQueueOnFail, ...customConfig } = options;
    // جلب رمز التحقق من التخزين المحلي
    const token = localStorage.getItem('token');
    // تحديد طريقة الإرسال (GET بشكل افتراضي إذا لم يتم إرساله)
    const method = customConfig.method || 'GET';

    // تجهيز الترويسات
    const headers: Record<string, string> = {
        ...(customConfig.headers as Record<string, string>),
    };

    // وضع نوع المحتوى الافتراضي كـ JSON ما لم تكن البيانات بصيغة FormData (للصور والملفات)
    if (!(customConfig.body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
    }

    // إضافة ترويسة المصادقة إذا وُجد الرمز
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    // بناء الرابط النهائي
    let url = `${API_URL}${endpoint}`;
    if (params) {
        // إضافة محددات البحث إلى الرابط إذا وجدت
        const searchParams = new URLSearchParams(params);
        url += `?${searchParams.toString()}`;
    }

    // الإعدادات النهائية للطلب
    const config: RequestInit = {
        ...customConfig,
        headers,
    };

    // تحديد اسم الجدول من الرابط لمزامنة الأوفلاين
    const tableName = endpoint.replace(/^\//, '').split('/')[0];
    // تحديد الجداول المدعومة في وضع الأوفلاين
    const isSupportedTable = ['universities', 'colleges', 'departments', 'announcements', 'research', 'graduates', 'jobs'].includes(tableName);

    // معالجة طلبات الجلب (GET) للحفظ المؤقت في الجهاز
    if (method === 'GET' && isSupportedTable && !skipCache) {
        try {
            // محاولة جلب البيانات من الخادم أولاً
            const response = await fetch(url, config);
            if (response.ok) {
                const data = await response.json();
                // إذا كانت سلسلة بيانات، قم بحفظها في قاعدة البيانات المحلية لاستخدامها لاحقاً
                if (Array.isArray(data) && !params) {
                    await db.table(tableName).clear(); // مسح البيانات القديمة
                    await db.table(tableName).bulkAdd(data); // إدخال الجديدة (المحفظ حتى في جهاز المستخدم)
                }
                return data; // إرجاع البيانات الجديدة للمكون
            }
        } catch (error) {
            // في حالة انقطاع الإنترنت أو وجود عطل، أبلغ في الكونسول
            console.warn('Network error, attempting to serve from cache:', endpoint);
            // محاولة جلبها من التخزين المحلي (IndexedDB)
            const cachedData = await db.table(tableName).toArray();
            if (cachedData.length > 0) return cachedData; // إرجاعها إن وجدت
            throw error; // وإلا قذف المشكلة لمن يتعامل معها
        }
    }

    // تنفيذ بقية أنواع الطلبات والمعالجة الأساسية
    try {
        const response = await fetch(url, config);
        const data = await response.json();

        // إرجاع البيانات بنجاح إذا كان الكود سليم
        if (response.ok) {
            return data;
        } else {
            // معالجة الأخطاء القادمة من السيرفر وعرضها حسب اللغة
            const isAr = localStorage.getItem('language') === 'ar';
            const genericMsg = isAr ? 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' : 'An unexpected error occurred, please try again later';
            const serverMsg = data.error || genericMsg;

            // تسجيل الخطأ آليًا في الخادم لتحليله من قبل مدير الموقع (إذا لم يكن هو مسار الأخطاء نفسه لتجنب الشلل)
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
                // خطأ داخلي في الخادم
                throw new Error(genericMsg);
            }
            // رسالة اعتيادية
            throw new Error(serverMsg);
        }
    } catch (error: any) {
        // إذا فشل الطلب بالكامل وحدث انقطاع للشبكة وكانت العملية تغيير (إضافة/حذف/تعديل)
        if (method !== 'GET' && isSupportedTable && !skipQueueOnFail && (error.message.includes('Failed to fetch') || !navigator.onLine)) {
            // تسجيل العملية في جهاز المستخدم لمزامنتها عند توفر الإنترنت لاحقاً
            console.log('Offline: Queuing mutation for', endpoint);
            await addToSyncQueue(tableName, method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update', JSON.parse(customConfig.body as string || '{}'));
            return { message: 'Action queued for sync', offline: true };
        }

        // إذا فشل بسبب آخر (موقع معطل تماما) يبلغ عنه
        if (endpoint !== '/error_logs' && !skipQueueOnFail) {
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
        throw error; // قذف الخطأ للمكون ليظهره للمستخدم
    }
};

// مستمع لحدث رجوع الإنترنت يقوم بمزامنة التخزين المحلي المؤجل
if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
        // تشغيل جميع العمليات المتأخرة
        processSyncQueue(apiClient).catch(console.error);
    });
}

// دالة تفريغ روابط الملفات (تكميل المسارات لتكون مطلقة بالكامل)
export const getMediaUrl = (path: string | null | undefined) => {
    if (!path) return ''; // لا يوجد رابط مسار
    if (path.startsWith('http')) return path; // المسار المطلق كامل جاهز
    // إضافة رابط الخادم كجذر لتكوين الرابط المطلق
    const baseUrl = API_URL.replace(/\/api$/, '');
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};

// تصدير واجهة الاتصال كافتراض
export default apiClient;
