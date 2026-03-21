const path = require('path'); // استيراد وحدة 'path' للتعامل مع مسارات الملفات والمجلدات
require('dotenv').config({ path: path.join(__dirname, '.env') }); // تحميل متغيرات البيئة من ملف .env
const express = require('express'); // استيراد إطار العمل express لإنشاء خادم الويب
const cors = require('cors'); // استيراد cors للسماح بالطلبات من نطاقات مختلفة
const rateLimit = require('express-rate-limit'); // استيراد rate-limit لتحديد عدد الطلبات لحماية الخادم
const db = require('./db'); // استيراد ملف إعدادات قاعدة البيانات


// استيراد جميع مسارات الـ API
const authRoutes = require('./routes/auth'); // مسارات المصادقة (تسجيل الدخول، الخ)
const universitiesRoutes = require('./routes/universities'); // مسارات الجامعات
const collegesRoutes = require('./routes/colleges'); // مسارات الكليات
const departmentsRoutes = require('./routes/departments'); // مسارات الأقسام
const announcementsRoutes = require('./routes/announcements'); // مسارات الإعلانات
const researchRoutes = require('./routes/research'); // مسارات الأبحاث
const jobsRoutes = require('./routes/jobs'); // مسارات الوظائف
const jobApplicationsRoutes = require('./routes/job_applications'); // مسارات طلبات التوظيف
const feesRoutes = require('./routes/fees'); // مسارات الرسوم
const graduatesRoutes = require('./routes/graduates'); // مسارات الخريجين
const servicesRoutes = require('./routes/services'); // مسارات الخدمات
const errorLogsRoutes = require('./routes/error_logs'); // مسارات سجلات الأخطاء
const aboutRoutes = require('./routes/about'); // مسارات معلومات "عن التطبيق"
const messagesRoutes = require('./routes/messages'); // مسارات الرسائل
const uploadRoutes = require('./routes/uploads'); // مسارات رفع الملفات
const adminRoutes = require('./routes/admins'); // مسارات لوحة التحكم (المديرين)
const permissionsRoutes = require('./routes/permissions'); // مسارات الصلاحيات
const syncRoutes = require('./routes/sync'); // مسارات المزامنة
const backupRoutes = require('./routes/backup'); // مسارات النسخ الاحتياطي
const { initBackupScheduler } = require('./backupScheduler'); // استيراد وظيفة جدولة النسخ الاحتياطي


const app = express(); // إنشاء كائن تطبيق Express
const PORT = process.env.PORT || 5000; // تحديد المنفذ (من البيئة أو 5000 افتراضياً)

// --- Rate Limiting ---
// General API limiter: 300 requests per 15 minutes per IP
const apiLimiter = rateLimit({ // تعريف محدد الطلبات العام
    windowMs: 15 * 60 * 1000, // المدة الزمنية (15 دقيقة)
    max: 300, // الحد الأقصى للطلبات (300 طلب)
    standardHeaders: true, // إرجاع معلومات الحد في ترويسات الاستجابة
    legacyHeaders: false, // عدم استخدام الترويسات القديمة
    message: { error: 'Too many requests, please try again later.' } // رسالة الخطأ عند تجاوز الحد
});
// Strict limiter for auth routes: 20 requests per 15 minutes
const authLimiter = rateLimit({ // تعريف محدد طلبات صارم للمصادقة
    windowMs: 15 * 60 * 1000, // المدة الزمنية (15 دقيقة)
    max: 20, // الحد الأقصى (20 محاولة)
    message: { error: 'Too many login attempts, please try again later.' } // رسالة الخطأ
});


// --- إعدادات الأمان والبرمجيات الوسيطة ---

// CORS: السماح فقط بالمصادر المعروفة
const allowedOrigins = process.env.NODE_ENV === 'production' // تحديد المصادر المسموح بها بناءً على البيئة
    ? (process.env.ALLOWED_ORIGINS || 'https://smartuniversity.vercel.app').split(',').map(o => o.trim()) // في الإنتاج
    : ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080', 'http://localhost:3000']; // في التطوير

app.use(cors({ // تفعيل برمجية CORS الوسيطة
    origin: (origin, callback) => { // وظيفة التحقق من المصدر
        // السماح بالطلبات التي ليس لها origin (مثل Postman) أو الـ origins المسموح بها
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) { // التحقق من صحة المصدر
            callback(null, true); // السماح بالطلب
        } else { // إذا كان المصدر غير مسموح به
            console.error(`CORS rejected origin: ${origin}`); // تسجيل المصدر المرفوض في لوحة التحكم
            callback(new Error('Not allowed by CORS')); // رفض الطلب مع رسالة خطأ
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'], // الطرق المسموح بها (GET, POST, الخ)
    allowedHeaders: ['Content-Type', 'Authorization'] // الترويسات المسموح بها
}));

// تحديد حجم الطلبات لمنع هجمات DoS
app.use(express.json({ limit: '10mb' })); // تحليل بيانات JSON بحد أقصى 10 ميجابايت
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // تحليل بيانات URL-encoded بحد أقصى 10 ميجابايت

// تسجيل الطلبات في بيئة التطوير فقط
if (process.env.NODE_ENV !== 'production') { // التحقق مما إذا كانت البيئة ليست إنتاجية
    app.use((req, res, next) => { // برمجية وسيطة لتسجيل الطلبات
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`); // طباعة الوقت والطريقة والمسار
        next(); // الانتقال للبرمجية التالية
    });
}

// جعل مجلد التحميلات متاحاً للعموم
app.use('/uploads', express.static(path.join(__dirname, 'uploads'))); // توفير الوصول للملفات الثابتة في مجلد uploads

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
const fs = require('fs'); // استيراد وحدة 'fs' للتعامل مع نظام الملفات
if (!fs.existsSync(path.join(__dirname, 'uploads'))) { // التحقق من وجود مجلد uploads
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true }); // إنشاء المجلد بشكل متكرر إذا لم يكن موجوداً
}

// --- تعريف المسارات ---
app.use('/api/auth', authLimiter, authRoutes); // ربط مسارات المصادقة مع محدد الطلبات الصارم
app.use('/api', apiLimiter); // تطبيق محدد الطلبات العام على جميع مسارات /api بعد المصادقة

app.use('/api/universities', universitiesRoutes); // ربط مسارات الجامعات
app.use('/api/colleges', collegesRoutes); // ربط مسارات الكليات
app.use('/api/departments', departmentsRoutes); // ربط مسارات الأقسام
app.use('/api/announcements', announcementsRoutes); // ربط مسارات الإعلانات
app.use('/api/research', researchRoutes); // ربط مسارات الأبحاث
app.use('/api/jobs', jobsRoutes); // ربط مسارات الوظائف
app.use('/api/job_applications', jobApplicationsRoutes); // ربط مسارات طلبات التوظيف
app.use('/api/fees', feesRoutes); // ربط مسارات الرسوم
app.use('/api/graduates', graduatesRoutes); // ربط مسارات الخريجين
app.use('/api/services', servicesRoutes); // ربط مسارات الخدمات
app.use('/api/about', aboutRoutes); // ربط مسارات معلومات "عن"
app.use('/api/messages', messagesRoutes); // ربط مسارات الرسائل
app.use('/api/upload', uploadRoutes); // ربط مسارات رفع الملفات
app.use('/api/admins', adminRoutes); // ربط مسارات المديرين
app.use('/api/permissions', permissionsRoutes); // ربط مسارات الصلاحيات
app.use('/api/error_logs', errorLogsRoutes); // ربط مسارات سجلات الأخطاء
app.use('/api/sync', syncRoutes); // ربط مسارات المزامنة
app.use('/api/backup', backupRoutes); // ربط مسارات النسخ الاحتياطي

// Initialize backup scheduler
initBackupScheduler(); // تشغيل مجدول النسخ الاحتياطي التلقائي


// نقطة فحص صحة الخادم
app.get('/api/health', (req, res) => { // تعريف مسار فحص الصحة
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() }); // إرجاع حالة الخادم والوقت الحالي
});

// --- معالجة الأخطاء العامة (يجب أن تكون آخر middleware) ---
app.use((err, req, res, next) => { // برمجية وسيطة لمعالجة الأخطاء
    // لا نكشف تفاصيل الخطأ الداخلية للعميل
    if (err.message === 'Not allowed by CORS') { // التحقق إذا كان الخطأ متعلق بـ CORS
        return res.status(403).json({ error: 'CORS policy violation' }); // إرجاع حالة 403 (محظور)
    }
    console.error('Unhandled error:', err); // تسجيل الخطأ غير المعالج في لوحة التحكم
    res.status(500).json({ error: 'An unexpected error occurred', details: err.message }); // إرجاع حالة 500 (خطأ داخلي)
});

// معالجة المسارات غير الموجودة
app.use((req, res) => { // برمجية وسيطة للمسارات غير المعرفة
    res.status(404).json({ error: 'Route not found' }); // إرجاع حالة 404 (غير موجود)
});

// تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => { // الاستماع للطلبات على المنفذ والعنوان المحدد
    console.log(`✅ الخادم يعمل بنجاح على المنفذ: ${PORT}`); // رسالة نجاح التشغيل
    console.log(`🔒 الوضع: ${process.env.NODE_ENV || 'development'}`); // رسالة توضح وضع التشغيل (تطوير أو إنتاج)
});
