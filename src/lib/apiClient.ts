// استيراد قاعدة البيانات المحلية ودوال المزامنة من ملف offlineDb
import { db, addToSyncQueue, processSyncQueue } from './offlineDb'; 

// مسار الخادم الأساسي يتم جلبه من المتغيرات البيئية أو استخدام مسار افتراضي (localhost:5000)
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'; 

// تعريف واجهة (Interface) لخصائص الطلب المتوقعة لتسهيل التعامل مع TypeScript
interface RequestOptions extends RequestInit { 
    params?: Record<string, string>; // إضافة دعم لمعاملات البحث (Query Params) في الرابط
    skipCache?: boolean; // خيار لتحديد ما إذا كان يجب تخطي الذاكرة المخبأة (Cache)
    skipQueueOnFail?: boolean; // خيار لمنع إضافة الطلب في طابور المزامنة عند الفشل (لتجنب التكرار اللا نهائي)
}

// إنشاء الوظيفة الأساسية للتواصل مع الـ API (apiClient)
const apiClient = async (endpoint: string, options: RequestOptions = {}) => { 
    // تفكيك الخصائص المخصصة وفصلها عن الخصائص القياسية للطلب (مثل headers, method)
    const { params, skipCache, skipQueueOnFail, ...customConfig } = options; 
    // جلب رمز التحقق (JWT Token) من التخزين المحلي للمتصفح (LocalStorage)
    const token = localStorage.getItem('token'); 
    // تحديد طريقة الإرسال (GET بشكل افتراضي إذا لم يتم تحديدها في الخصائص)
    const method = customConfig.method || 'GET'; 

    // تجهيز الترويسات (Headers) الخاصة بالطلب
    const headers: Record<string, string> = { 
        ...(customConfig.headers as Record<string, string>), // دمج أي ترويسات مرسلة مسبقاً
    };

    // تعيين نوع المحتوى كـ JSON بشكل تلقائي ما لم تكن البيانات بصيغة FormData (المستخدمة لرفع الملفات)
    if (!(customConfig.body instanceof FormData)) { 
        headers['Content-Type'] = 'application/json'; 
    }

    // إضافة ترويسة المصادقة (Authorization) إذا كان هناك رمز دخول مخزن
    if (token) { 
        headers.Authorization = `Bearer ${token}`; 
    }

    // بناء الرابط النهائي للطلب من خلال دمج المسار الأساسي مع المسار الفرعي (Endpoint)
    let url = `${API_URL}${endpoint}`; 
    if (params) { 
        // إذا وجدت معاملات بحث، يتم تحويلها إلى نص (Query String) وإضافتها للرابط
        const searchParams = new URLSearchParams(params); 
        url += `?${searchParams.toString()}`; 
    }

    // تجميع الإعدادات النهائية لعملية الجلب (Fetch)
    const config: RequestInit = { 
        ...customConfig, // دمج الإعدادات المخصصة
        headers, // إضافة الترويسات التي تم تجهيزها
    };

    // استخراج اسم الجدول من المسار الفرعي (مثلاً /universities تصبح universities) لاستخدامه في المزامنة
    const tableName = endpoint.replace(/^\//, '').split('/')[0]; 
    // تحديد الجداول التي تدعم العمل في وضع "بدون إنترنت" (Offline Mode)
    const isSupportedTable = ['universities', 'colleges', 'departments', 'announcements', 'research', 'graduates', 'jobs'].includes(tableName); 

    // معالجة طلبات جلب البيانات (GET) لدعم التخزين المؤقت (Caching)
    if (method === 'GET' && isSupportedTable && !skipCache) { 
        try { 
            // محاولة جلب أحدث البيانات من الخادم عبر الإنترنت
            const response = await fetch(url, config); 
            if (response.ok) { 
                const data = await response.json(); // تحويل الاستجابة إلى كائن JSON
                // إذا كانت البيانات عبارة عن قائمة (Array) وبدون معاملات بحث خاصة، يتم تحديث التخزين المحلي
                if (Array.isArray(data) && !params) { 
                    try {
                        await db.table(tableName).clear(); // مسح البيانات القديمة المخزنة في الجهاز
                        await db.table(tableName).bulkAdd(data); // إضافة البيانات الجديدة المستلمة من الخادم
                    } catch (cacheError) {
                        console.warn('Cache update failed, continuing without cache:', cacheError);
                    }
                }
                return data; // إرجاع البيانات المستلمة للمكون الذي طلبها
            }
            // إذا كانت الاستجابة غير ناجحة، نعالجها مباشرة بدلاً من السقوط للمعالج العام
            const errorData = await response.json().catch(() => ({}));
            const isAr = localStorage.getItem('language') === 'ar';
            const genericMsg = isAr ? 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' : 'An unexpected error occurred, please try again later';
            throw new Error(errorData.error || genericMsg);
        } catch (error: any) { 
            // في حال فشل الاتصال بالإنترنت، يتم طباعة تحذير ومحاولة جلب البيانات من الذاكرة المحلية
            if (error.message?.includes('Failed to fetch') || !navigator.onLine) {
                console.warn('Network error, attempting to serve from cache:', endpoint); 
                try {
                    // البحث عن البيانات في قاعدة البيانات المحلية (IndexedDB)
                    const cachedData = await db.table(tableName).toArray(); 
                    if (cachedData.length > 0) return cachedData; // إرجاع البيانات المخزنة محلياً إذا وُجدت
                } catch (cacheReadError) {
                    console.warn('Cache read failed:', cacheReadError);
                }
            }
            throw error; // إذا لم توجد بيانات مخزنة، يتم إرسال الخطأ للأعلى
        }
    }

    // تنفيذ بقية أنواع الطلبات (POST, PUT, DELETE) ومعالجة الاستجابات
    try { 
        const response = await fetch(url, config); // إرسال الطلب للخادم
        const data = await response.json(); // قراءة الاستجابة

        // في حال نجاح الطلب (كود الحالة 200-299)
        if (response.ok) { 
            return data; // إرجاع البيانات بنجاح
        } else { 
            // معالجة الأخطاء المرسلة من الخادم بناءً على لغة المستخدم
            const isAr = localStorage.getItem('language') === 'ar'; 
            const genericMsg = isAr ? 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً' : 'An unexpected error occurred, please try again later'; 
            const serverMsg = data.error || genericMsg; // استخدام رسالة الخطأ من السيرفر أو الرسالة العامة

            // إرسال تقرير بالخطأ للخادم (Error Logging) لتحليله لاحقاً من قبل المطورين
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
                    }).catch(() => { }); // تجاهل أي خطأ قد يحدث أثناء إرسال سجل الخطأ
                } catch (e) { } 
            }

            // إذا كان الخطأ داخلي في الخادم (500 وما فوق) يتم عرض رسالة عامة
            if (response.status >= 500) { 
                throw new Error(genericMsg); 
            }
            // إرسال رسالة الخطأ المحددة
            throw new Error(serverMsg); 
        }
    } catch (error: any) { 
        // في حال فشل الطلب بسبب انقطاع الإنترنت وكانت العملية (تعديل/إضافة/حذف)
        if (method !== 'GET' && isSupportedTable && !skipQueueOnFail && (error.message.includes('Failed to fetch') || !navigator.onLine)) { 
            // إضافة العملية إلى طابور المزامنة (Sync Queue) ليتم تنفيذها تلقائياً عند عودة الإنترنت
            console.log('Offline: Queuing mutation for', endpoint); 
            await addToSyncQueue(tableName, method === 'POST' ? 'create' : method === 'DELETE' ? 'delete' : 'update', JSON.parse(customConfig.body as string || '{}')); 
            return { message: 'Action queued for sync', offline: true }; // إخبار المستخدم بأن العملية تمت جدولتها
        }

        // تسجيل أخطاء الشبكة العامة في سجل الأخطاء
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
        console.error('API Error:', error.message); // طباعة الخطأ في الكونسول
        throw error; // إعادة إرسال الخطأ ليتم معالجته في المكون الرسومي
    }
};

// إضافة مستمع (Listener) لحدث عودة الاتصال بالإنترنت لمزامنة البيانات المؤجلة تلقائياً
if (typeof window !== 'undefined') { 
    window.addEventListener('online', () => { 
        // البدء في معالجة العمليات التي تم جدولتها أثناء انقطاع الإنترنت
        processSyncQueue(apiClient).catch(console.error); 
    });
}

// دالة مساعدة لتحويل مسارات الوسائط (الصور والملفات) إلى روابط كاملة وصحيحة
export const getMediaUrl = (path: string | null | undefined) => { 
    if (!path) return ''; // إذا لم يكن هناك مسار، يتم إرجاع نص فارغ
    if (path.startsWith('http')) return path; // إذا كان المسار رابطاً كاملاً بالفعل، يتم إرجاعه كما هو
    // تكوين الرابط الكامل من خلال دمج رابط الخادم مع مسار الملف
    const baseUrl = API_URL.replace(/\/api$/, ''); 
    return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`; 
};

// تصدير عميل الـ API ليكون متاحاً للاستخدام في جميع أنحاء التطبيق
export default apiClient;
