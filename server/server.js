const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const cors = require('cors');
const db = require('./db');

// استيراد جميع مسارات الـ API
const authRoutes = require('./routes/auth');
const universitiesRoutes = require('./routes/universities');
const collegesRoutes = require('./routes/colleges');
const departmentsRoutes = require('./routes/departments');
const announcementsRoutes = require('./routes/announcements');
const researchRoutes = require('./routes/research');
const jobsRoutes = require('./routes/jobs');
const jobApplicationsRoutes = require('./routes/job_applications');
const feesRoutes = require('./routes/fees');
const graduatesRoutes = require('./routes/graduates');
const servicesRoutes = require('./routes/services');
const errorLogsRoutes = require('./routes/error_logs');
const aboutRoutes = require('./routes/about');
const messagesRoutes = require('./routes/messages');
const uploadRoutes = require('./routes/uploads');
const adminRoutes = require('./routes/admins');
const permissionsRoutes = require('./routes/permissions');
const syncRoutes = require('./routes/sync');

const app = express();
const PORT = process.env.PORT || 5000;

// --- إعدادات الأمان والبرمجيات الوسيطة ---

// CORS: السماح فقط بالمصادر المعروفة
const allowedOrigins = process.env.NODE_ENV === 'production'
    ? (process.env.ALLOWED_ORIGINS || 'https://smartuniversity.vercel.app').split(',').map(o => o.trim())
    : ['http://localhost:8080', 'http://localhost:5173', 'http://127.0.0.1:8080', 'http://localhost:3000'];

app.use(cors({
    origin: (origin, callback) => {
        // السماح بالطلبات التي ليس لها origin (مثل Postman) أو الـ origins المسموح بها
        if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
        } else {
            console.error(`CORS rejected origin: ${origin}`);
            callback(new Error('Not allowed by CORS'));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

// تحديد حجم الطلبات لمنع هجمات DoS
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// تسجيل الطلبات في بيئة التطوير فقط
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
        next();
    });
}

// جعل مجلد التحميلات متاحاً للعموم
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// إنشاء مجلد التحميلات إذا لم يكن موجوداً
const fs = require('fs');
if (!fs.existsSync(path.join(__dirname, 'uploads'))) {
    fs.mkdirSync(path.join(__dirname, 'uploads'), { recursive: true });
}

// --- تعريف المسارات ---
app.use('/api/auth', authRoutes);
app.use('/api/universities', universitiesRoutes);
app.use('/api/colleges', collegesRoutes);
app.use('/api/departments', departmentsRoutes);
app.use('/api/announcements', announcementsRoutes);
app.use('/api/research', researchRoutes);
app.use('/api/jobs', jobsRoutes);
app.use('/api/job_applications', jobApplicationsRoutes);
app.use('/api/fees', feesRoutes);
app.use('/api/graduates', graduatesRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/about', aboutRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/admins', adminRoutes);
app.use('/api/permissions', permissionsRoutes);
app.use('/api/error_logs', errorLogsRoutes);
app.use('/api/sync', syncRoutes);

// نقطة فحص صحة الخادم
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server is running', timestamp: new Date() });
});

// --- معالجة الأخطاء العامة (يجب أن تكون آخر middleware) ---
app.use((err, req, res, next) => {
    // لا نكشف تفاصيل الخطأ الداخلية للعميل
    if (err.message === 'Not allowed by CORS') {
        return res.status(403).json({ error: 'CORS policy violation' });
    }
    console.error('Unhandled error:', err);
    res.status(500).json({ error: 'An unexpected error occurred' });
});

// معالجة المسارات غير الموجودة
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// تشغيل الخادم
app.listen(PORT, '0.0.0.0', () => {
    console.log(`✅ الخادم يعمل بنجاح على المنفذ: ${PORT}`);
    console.log(`🔒 الوضع: ${process.env.NODE_ENV || 'development'}`);
});
