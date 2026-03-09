const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express'); // استيراد مكتبة Express لإنشاء خادم الويب والتعامل مع الطلبات
const cors = require('cors'); // استيراد مكتبة CORS للسماح بالطلبات القادمة من نطاقات مختلفة (مثل الواجهة الأمامية)
const db = require('./db'); // استيراد كائن قاعدة البيانات من ملف db.js للقيام بالعمليات البرمجية

// استيراد جميع مسارات الـ API (Routes) من مجلد routes
const authRoutes = require('./routes/auth'); // استيراد مسارات المصادقة (تسجيل الدخول، استعادة كلمة المرور، الخ)
const universitiesRoutes = require('./routes/universities'); // استيراد مسارات إدارة بيانات الجامعات
const collegesRoutes = require('./routes/colleges'); // استيراد مسارات إدارة بيانات الكليات
const departmentsRoutes = require('./routes/departments'); // استيراد مسارات إدارة بيانات الأقسام العلمية
const announcementsRoutes = require('./routes/announcements'); // استيراد مسارات إدارة الإعلانات والمنشورات العامة
const researchRoutes = require('./routes/research'); // استيراد مسارات إدارة الأبحاث العلمية والطلاب المشاركين
const jobsRoutes = require('./routes/jobs'); // استيراد مسارات إدارة الوظائف الشاغرة
const jobApplicationsRoutes = require('./routes/job_applications'); // استيراد مسارات إدارة طلبات التوظيف واستعراض السير الذاتية
const feesRoutes = require('./routes/fees'); // استيراد مسارات إدارة الرسوم الدراسية لمختلف الأقسام
const graduatesRoutes = require('./routes/graduates'); // استيراد مسارات إدارة بيانات الخريجين وسنوات التخرج
const servicesRoutes = require('./routes/services'); // استيراد مسارات الخدمات الطلابية والروابط الهامة
const errorLogsRoutes = require('./routes/error_logs'); // استيراد مسارات سجل الأخطاء للمراقبة وتصحيح المشاكل
const aboutRoutes = require('./routes/about'); // استيراد مسارات إدارة محتوى صفحة "عن المشروع" ومعلومات المطور
const messagesRoutes = require('./routes/messages'); // استيراد مسارات نظام المراسلة الداخلي بين المدراء
const uploadRoutes = require('./routes/uploads'); // استيراد مسارات رفع الملفات والصور إلى السيرفر
const adminRoutes = require('./routes/admins'); // استيراد مسارات إدارة حسابات المسؤولين وتغيير أدوارهم
const permissionsRoutes = require('./routes/permissions'); // استيراد مسارات إدارة مصفوفة الصلاحيات لكل دور وظيفي
const syncRoutes = require('./routes/sync'); // استيراد مسارات المزامنة (Sync)


const app = express(); // إنشاء نسخة من تطبيق Express للبدء في تعريف المسارات والبرمجيات الوسيطة
const PORT = process.env.PORT || 5000; // تحديد المنفذ الذي سيعمل عليه السيرفر (الافتراضي هو 5000)

// البرمجيات الوسيطة (Middleware) الأساسية للتطبيق
app.use(cors({
    origin: '*', // في الإنتاج، يجب استبدال * بنطاق موقعك (مثل: https://smart-uni.vercel.app)
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json()); // تفعيل برمجية تحويل نصوص JSON المرسلة في الطلبات إلى كائنات برمجية قابلة للاستخدام

// وسيط مخصص لتسجيل كل طلب (Request) يصل للخادم في شاشة الكونسول للمتابعة
app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`); // طباعة وقت الطلب، نوعه (GET, POST...) والمسار
    next(); // الانتقال إلى المعالج التالي أو المسار المطلوب
});

// جعل مجلد التنزيلات (uploads) متاحاً للوصول العام عبر رابط ثابت ليتم عرض الصور والملفات في الموقع
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// التأكد من وجود مجلد التحميلات (Uploads) في القرص الصلب، وإنشاؤه فوراً إذا كان غير موجود
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'));
}

// تعريف المسارات (Routes) في التطبيق وربطها بالملفات المقابلة تحت بادئة /api
app.use('/api/auth', authRoutes); // ربط مسارات المصادقة
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
app.use('/api/about', aboutRoutes); // ربط مسارات صفحة من نحن
app.use('/api/messages', messagesRoutes); // ربط مسارات نظام المراسلة
app.use('/api/upload', uploadRoutes); // ربط مسارات رفع الملفات
app.use('/api/admins', adminRoutes); // ربط مسارات إدارة الإدمن
app.use('/api/permissions', permissionsRoutes); // ربط مسارات الصلاحيات
app.use('/api/error_logs', errorLogsRoutes); // ربط مسارات سجل الأخطاء
app.use('/api/sync', syncRoutes); // ربط مسارات المزامنة


// نقطة فحص سريعة للتأكد من أن السيرفر يعمل بشكل سليم
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() });
});

// البدء في تشغيل الخادم والانتظار لاستقبال الطلبات على المنفذ المحدد
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ الخادم يعمل بنجاح على المنفذ: ${PORT}`);
});
