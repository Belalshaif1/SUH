const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

/**
 * إعداد الاتصال بقاعدة بيانات PostgreSQL:
 * يتم استخدام متغيرات البيئة من ملف .env لتأمين البيانات الحساسة.
 */
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    // تفعيل SSL إذا كان الاتصال خارجي (مثل Supabase)
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false }
});

/**
 * التحقق من الاتصال بقاعدة البيانات
 */
pool.on('connect', () => {
    // console.log('✅ تم الاتصال بنجاح بقاعدة بيانات PostgreSQL.');
});

pool.on('error', (err) => {
    console.error('❌ خطأ غير متوقع في قاعدة البيانات:', err);
});

/**
 * دالة إنشاء الجداول (Schema Definition):
 * تم تحويل الصيغة من SQLite إلى PostgreSQL.
 */
async function createTables() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. جدول المستخدمين
        await client.query(`CREATE TABLE IF NOT EXISTS users (
            id UUID PRIMARY KEY, 
            email TEXT UNIQUE, 
            password TEXT NOT NULL, 
            full_name TEXT, 
            avatar_url TEXT, 
            phone TEXT, 
            is_active INTEGER DEFAULT 1, 
            role TEXT DEFAULT 'user', 
            university_id UUID, 
            college_id UUID, 
            department_id UUID, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            created_by UUID 
        )`);

        // 2. جدول الجامعات
        await client.query(`CREATE TABLE IF NOT EXISTS universities (
            id UUID PRIMARY KEY,
            name_ar TEXT NOT NULL, 
            name_en TEXT, 
            description_ar TEXT, 
            description_en TEXT, 
            guide_pdf_url TEXT, 
            logo_url TEXT, 
            is_pinned INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 3. جدول الكليات
        await client.query(`CREATE TABLE IF NOT EXISTS colleges (
            id UUID PRIMARY KEY,
            university_id UUID NOT NULL REFERENCES universities (id) ON DELETE CASCADE, 
            name_ar TEXT NOT NULL,
            name_en TEXT,
            description_ar TEXT,
            description_en TEXT,
            guide_pdf_url TEXT,
            logo_url TEXT,
            is_pinned INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 4. جدول الأقسام العلمية
        await client.query(`CREATE TABLE IF NOT EXISTS departments (
            id UUID PRIMARY KEY,
            college_id UUID NOT NULL REFERENCES colleges (id) ON DELETE CASCADE, 
            name_ar TEXT NOT NULL,
            name_en TEXT,
            description_ar TEXT,
            description_en TEXT,
            study_plan_url TEXT,
            logo_url TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 5. جدول الإعلانات
        await client.query(`CREATE TABLE IF NOT EXISTS announcements (
            id UUID PRIMARY KEY,
            title_ar TEXT NOT NULL,
            title_en TEXT,
            content_ar TEXT NOT NULL,
            content_en TEXT,
            scope TEXT DEFAULT 'global', 
            university_id UUID REFERENCES universities (id) ON DELETE CASCADE,
            college_id UUID REFERENCES colleges (id) ON DELETE CASCADE,
            image_url TEXT,
            file_url TEXT,
            is_pinned INTEGER DEFAULT 0,
            created_by UUID REFERENCES users (id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 6. جدول الخريجين
        await client.query(`CREATE TABLE IF NOT EXISTS graduates (
            id UUID PRIMARY KEY,
            department_id UUID NOT NULL REFERENCES departments (id) ON DELETE CASCADE,
            full_name_ar TEXT NOT NULL,
            full_name_en TEXT,
            graduation_year INTEGER NOT NULL, 
            gpa REAL, 
            specialization_ar TEXT,
            specialization_en TEXT,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 7. جدول الأبحاث العلمية
        await client.query(`CREATE TABLE IF NOT EXISTS research (
            id UUID PRIMARY KEY,
            department_id UUID NOT NULL REFERENCES departments (id) ON DELETE CASCADE,
            title_ar TEXT NOT NULL,
            title_en TEXT,
            abstract_ar TEXT, 
            abstract_en TEXT, 
            author_name TEXT NOT NULL, 
            published INTEGER DEFAULT 1, 
            publish_date TIMESTAMPTZ, 
            pdf_url TEXT, 
            students TEXT, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 8. جدول الوظائف الشاغرة
        await client.query(`CREATE TABLE IF NOT EXISTS jobs (
            id UUID PRIMARY KEY,
            college_id UUID NOT NULL REFERENCES colleges (id) ON DELETE CASCADE,
            title_ar TEXT NOT NULL,
            title_en TEXT,
            description_ar TEXT NOT NULL,
            description_en TEXT,
            requirements_ar TEXT,
            requirements_en TEXT,
            is_active INTEGER DEFAULT 1,
            is_pinned INTEGER DEFAULT 0,
            deadline TIMESTAMPTZ, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 9. جدول طلبات التوظيف
        await client.query(`CREATE TABLE IF NOT EXISTS job_applications (
            id UUID PRIMARY KEY,
            job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            file_url TEXT NOT NULL, 
            status TEXT DEFAULT 'pending', 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 10. جدول الرسوم الدراسية
        await client.query(`CREATE TABLE IF NOT EXISTS fees (
            id UUID PRIMARY KEY,
            department_id UUID NOT NULL REFERENCES departments (id) ON DELETE CASCADE,
            fee_type TEXT NOT NULL, 
            amount REAL NOT NULL, 
            currency TEXT DEFAULT 'IQD', 
            academic_year TEXT, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 11. جدول سجل الأخطاء
        await client.query(`CREATE TABLE IF NOT EXISTS error_logs (
            id UUID PRIMARY KEY,
            message TEXT NOT NULL, 
            stack_trace TEXT, 
            source TEXT, 
            user_id TEXT, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 12. جدول الخدمات الطلابية
        await client.query(`CREATE TABLE IF NOT EXISTS services (
            id UUID PRIMARY KEY,
            title_ar TEXT NOT NULL,
            title_en TEXT,
            description_ar TEXT,
            description_en TEXT,
            icon TEXT, 
            link TEXT, 
            is_active INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 13. جدول الرسائل
        await client.query(`CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY,
            sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE,
            receiver_id UUID,
            content TEXT NOT NULL,
            is_read INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        // 14. جدول معلومات التطبيق والمطور
        await client.query(`CREATE TABLE IF NOT EXISTS about_us (
            id UUID PRIMARY KEY,
            content_ar TEXT,
            content_en TEXT,
            developer_name_ar TEXT,
            developer_name_en TEXT,
            developer_bio_ar TEXT,
            developer_bio_en TEXT,
            developer_image_url TEXT
        )`);

        // 15. جدول مصفوفة الصلاحيات
        await client.query(`CREATE TABLE IF NOT EXISTS role_permissions (
            id UUID PRIMARY KEY,
            role TEXT NOT NULL, 
            permission_key TEXT NOT NULL, 
            is_enabled INTEGER DEFAULT 0,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role, permission_key)
        )`);

        // 16. جدول الصلاحيات الخاصة
        await client.query(`CREATE TABLE IF NOT EXISTS user_permissions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            permission_key TEXT NOT NULL,
            is_enabled INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`);

        await client.query('COMMIT');

        // إدراج البيانات الأساسية بعد اكتمال إنشاء الجداول
        await insertDefaultData();
        console.log('✅ تم الانتهاء من إعداد جداول PostgreSQL.');
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('❌ فشل في إنشاء الجداول:', e.message);
    } finally {
        client.release();
    }
}

/**
 * دالة إدراج البيانات الافتراضية
 */
async function insertDefaultData() {
    try {
        const adminCheck = await pool.query("SELECT count(*) FROM users WHERE role = 'super_admin'");
        if (parseInt(adminCheck.rows[0].count) === 0) {
            const adminId = uuidv4();
            const passwordHash = bcrypt.hashSync('Bilal147', 10);

            await pool.query(
                `INSERT INTO users (id, email, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)`,
                [adminId, 'Belal@admin.com', passwordHash, 'بلال شائف', 'super_admin', 1]
            );

            console.log('🚀 تم إنشاء حساب المدير العام: Belal@admin.com / Bilal147');

            const roles = ['super_admin', 'university_admin', 'college_admin', 'department_admin'];
            const permissions = [
                'manage_universities', 'manage_colleges', 'manage_departments',
                'manage_users', 'manage_announcements', 'manage_jobs',
                'manage_research', 'manage_graduates', 'manage_fees',
                'view_reports', 'advanced_settings'
            ];

            for (const role of roles) {
                for (const perm of permissions) {
                    let isEnabled = 0;
                    if (role === 'super_admin') isEnabled = 1;
                    else if (role === 'university_admin') {
                        if (['manage_universities', 'manage_colleges', 'manage_departments', 'manage_users', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
                            isEnabled = 1;
                        }
                    } else if (role === 'college_admin') {
                        if (['manage_colleges', 'manage_departments', 'manage_users', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
                            isEnabled = 1;
                        }
                    } else if (role === 'department_admin') {
                        if (['manage_departments', 'manage_announcements', 'manage_research', 'manage_graduates'].includes(perm)) {
                            isEnabled = 1;
                        }
                    }

                    await pool.query(
                        `INSERT INTO role_permissions (id, role, permission_key, is_enabled) VALUES ($1, $2, $3, $4) ON CONFLICT (role, permission_key) DO NOTHING`,
                        [uuidv4(), role, perm, isEnabled]
                    );
                }
            }
        }
    } catch (e) {
        console.error('❌ خطأ في إدراج البيانات الافتراضية:', e.message);
    }
}

/**
 * متوافقية مع الـ API المستخدم سابقاً
 */
const db = {
    query: (text, params) => pool.query(text, params).then(res => res.rows),
    getAsync: (text, params) => pool.query(text, params).then(res => res.rows[0]),
    runAsync: (text, params) => pool.query(text, params).then(res => ({ lastID: null, changes: res.rowCount })),
    pool
};

// تهيئة الجداول عند التشغيل
createTables();

module.exports = db;
