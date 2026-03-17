const { Pool } = require('pg'); // استيراد فئة Pool من مكتبة pg للتعامل مع قاعدة بيانات PostgreSQL
const bcrypt = require('bcryptjs'); // استيراد مكتبة bcryptjs لتشفير كلمات المرور
const { v4: uuidv4 } = require('uuid'); // استيراد وظيفة uuidv4 لإنشاء معرفات فريدة عالمياً

/**
 * إعداد الاتصال بقاعدة بيانات PostgreSQL:
 * يتم استخدام متغيرات البيئة من ملف .env لتأمين البيانات الحساسة.
 */
const pool = new Pool({ // إنشاء كائن Pool جديد لإدارة اتصالات قاعدة البيانات
    connectionString: process.env.DATABASE_URL, // تعيين رابط الاتصال من متغيرات البيئة
    // تفعيل SSL إذا كان الاتصال خارجي (مثل Supabase)
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } // إعداد التشفير SSL بناءً على بيئة التشغيل
});

/**
 * التحقق من الاتصال بقاعدة البيانات
 */
pool.on('connect', () => { // الاستماع لحدث الاتصال بنجاح
    // console.log('✅ تم الاتصال بنجاح بقاعدة بيانات PostgreSQL.');
});

pool.on('error', (err) => { // الاستماع لأي أخطاء مفاجئة في الاتصال
    console.error('❌ خطأ غير متوقع في قاعدة البيانات:', err); // طباعة الخطأ في لوحة التحكم
});

/**
 * دالة إنشاء الجداول (Schema Definition):
 * تم تحويل الصيغة من SQLite إلى PostgreSQL.
 */
async function createTables() { // تعريف دالة غير متزامنة لإنشاء الجداول
    const client = await pool.connect(); // الحصول على عميل اتصال من الـ pool
    try { // بدء محاولة تنفيذ الاستعلامات
        await client.query('BEGIN'); // بدء معاملة (Transaction) لضمان تنفيذ جميع العمليات أو تراجعها بالكامل

        // 1. جدول المستخدمين (المسؤول عن تخزين بيانات الطلاب والمدراء)
        await client.query(`CREATE TABLE IF NOT EXISTS users ( 
            id UUID PRIMARY KEY,                   -- المعرف الفريد للمستخدم (UUID)
            email TEXT UNIQUE,                     -- البريد الإلكتروني (يجب أن يكون فريداً)
            password TEXT NOT NULL,                -- كلمة المرور المشفرة
            full_name TEXT,                        -- الاسم الكامل للمستخدم
            avatar_url TEXT,                       -- رابط الصورة الشخصية
            phone TEXT,                            -- رقم الهاتف للتواصل أو التسجيل
            is_active INTEGER DEFAULT 1,           -- حالة الحساب (1: مفعل، 0: معطل)
            role TEXT DEFAULT 'user',              -- دور المستخدم (user, super_admin, university_admin, etc.)
            university_id UUID,                    -- معرف الجامعة التابع لها (للمدراء)
            college_id UUID,                       -- معرف الكلية التابع لها (للمدراء)
            department_id UUID,                    -- معرف القسم التابع له (للمدراء)
            reset_token TEXT,                      -- رمز استعادة كلمة المرور المؤقت
            reset_token_expires TIMESTAMPTZ,      -- تاريخ انتهاء صلاحية رمز الاستعادة
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- تاريخ إنشاء الحساب
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- تاريخ آخر تحديث للبيانات
            created_by UUID                        -- معرف من قام بإنشاء هذا الحساب
        )`); // إنشاء جدول المستخدمين إذا لم يكن موجوداً

        // إضافة عمود reset_token إذا لم يكن موجودًا
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token') THEN
                    ALTER TABLE users ADD COLUMN reset_token TEXT;
                END IF;
            END
            $$;
        `); // استعلام للتحقق من وجود عمود رمز استعادة كلمة المرور وإضافته إذا غاب

        // إضافة عمود reset_token_expires إذا لم يكن موجودًا
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='reset_token_expires') THEN
                    ALTER TABLE users ADD COLUMN reset_token_expires TIMESTAMPTZ;
                END IF;
            END
            $$;
        `); // استعلام للتحقق من وجود عمود تاريخ انتهاء رمز الاستعادة وإضافته

        // 2. جدول الجامعات (لتخزين بيانات الجامعات المشتركة في النظام)
        await client.query(`CREATE TABLE IF NOT EXISTS universities (
            id UUID PRIMARY KEY,                   -- المعرف الفريد للجامعة
            name_ar TEXT NOT NULL,                 -- اسم الجامعة بالعربي
            name_en TEXT,                          -- اسم الجامعة بالإنجليزي
            description_ar TEXT,                   -- وصف الجامعة بالعربي
            description_en TEXT,                   -- وصف الجامعة بالإنجليزي
            guide_pdf_url TEXT,                    -- رابط ملف دليل الطالب (PDF)
            logo_url TEXT,                         -- رابط شعار الجامعة
            is_pinned INTEGER DEFAULT 0,           -- هل تظهر الجامعة في المقدمة؟ (1: نعم)
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, -- وقت الإضافة
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP  -- وقت التحديث
        )`); // إنشاء جدول الجامعات

        // 3. جدول الكليات (المرتبطة بالجامعات)
        await client.query(`CREATE TABLE IF NOT EXISTS colleges (
            id UUID PRIMARY KEY,                                      -- المعرف الفريد للكلية
            university_id UUID NOT NULL REFERENCES universities (id) ON DELETE CASCADE, -- الربط بالجامعة (حذف الكلية عند حذف الجامعة)
            name_ar TEXT NOT NULL,                                    -- اسم الكلية بالعربي
            name_en TEXT,                                             -- اسم الكلية بالإنجليزي
            description_ar TEXT,                                      -- وصف الكلية بالعربي
            description_en TEXT,                                      -- وصف الكلية بالإنجليزي
            guide_pdf_url TEXT,                                       -- دليل الكلية
            logo_url TEXT,                                            -- شعار الكلية
            is_pinned INTEGER DEFAULT 0,                              -- هل تظهر في المقدمة؟
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول الكليات مع علاقة ربط بالجامعات

        // 4. جدول الأقسام العلمية (المرتبطة بالكليات)
        await client.query(`CREATE TABLE IF NOT EXISTS departments (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد للقسم
            college_id UUID NOT NULL REFERENCES colleges (id) ON DELETE CASCADE, -- الربط بالكلية
            name_ar TEXT NOT NULL,                                 -- اسم القسم بالعربي
            name_en TEXT,                                          -- اسم القسم بالإنجليزي
            description_ar TEXT,                                   -- وصف القسم بالعربي
            description_en TEXT,                                   -- وصف القسم بالإنجليزي
            study_plan_url TEXT,                                   -- رابط ملف الخطة الدراسية
            logo_url TEXT,                                         -- شعار القسم
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول الأقسام مع علاقة ربط بالكليات

        // 5. جدول الإعلانات (الأخبار والتعميمات)
        await client.query(`CREATE TABLE IF NOT EXISTS announcements (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد للإعلان
            title_ar TEXT NOT NULL,                                -- عنوان الإعلان بالعربي
            title_en TEXT,                                         -- عنوان الإعلان بالإنجليزي
            content_ar TEXT NOT NULL,                              -- محتوى الإعلان بالعربي
            content_en TEXT,                                       -- محتوى الإعلان بالإنجليزي
            scope TEXT DEFAULT 'global',                           -- نطاق الإعلان (عام، جامعة محددة، كلية محددة)
            university_id UUID REFERENCES universities (id) ON DELETE CASCADE, -- الربط بالجامعة (إذا كان نطاقه جامعة)
            college_id UUID REFERENCES colleges (id) ON DELETE CASCADE,      -- الربط بالكلية (إذا كان نطاقه كلية)
            image_url TEXT,                                        -- رابط صورة مرفقة مع الإعلان
            file_url TEXT,                                         -- رابط ملف مرفق (مثل تعميم PDF)
            is_pinned INTEGER DEFAULT 0,                           -- هل يتم تثبيت الإعلان في الأعلى؟
            created_by UUID REFERENCES users (id) ON DELETE SET NULL, -- من قام بإنشاء الإعلان
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول الإعلانات مع خيارات تحديد النطاق

        // 6. جدول الخريجين (لعرض قصص النجاح أو بيانات المتخرجين)
        await client.query(`CREATE TABLE IF NOT EXISTS graduates (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد
            department_id UUID NOT NULL REFERENCES departments (id) ON DELETE CASCADE, -- القسم الذي تخرج منه
            full_name_ar TEXT NOT NULL,                            -- اسم الخريج بالعربي
            full_name_en TEXT,                                     -- اسم الخريج بالإنجليزي
            graduation_year INTEGER NOT NULL,                      -- سنة التخرج
            gpa REAL,                                              -- المعدل التراكمي
            specialization_ar TEXT,                                -- التخصص المكتوب بالعربي
            specialization_en TEXT,                                -- التخصص بالإنجليزي
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول بيانات الخريجين

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
        )`); // إنشاء جدول الأبحاث العلمية

        // 8. جدول الوظائف الشاغرة (المطروحة من قبل الكليات)
        await client.query(`CREATE TABLE IF NOT EXISTS jobs (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد للوظيفة
            college_id UUID NOT NULL REFERENCES colleges (id) ON DELETE CASCADE, -- الكلية التي طرحت الوظيفة
            title_ar TEXT NOT NULL,                                -- مسمى الوظيفة بالعربي
            title_en TEXT,                                         -- مسمى الوظيفة بالإنجليزي
            description_ar TEXT NOT NULL,                          -- وصف المهام بالعربي
            description_en TEXT,                                   -- وصف المهام بالإنجليزي
            requirements_ar TEXT,                                  -- المتطلبات والشروط بالعربي
            requirements_en TEXT,                                  -- المتطلبات والشروط بالإنجليزي
            is_active INTEGER DEFAULT 1,                           -- هل التقديم متاح حالياً؟
            is_pinned INTEGER DEFAULT 0,                           -- هل يتم تمييزها في المقدمة؟
            deadline TIMESTAMPTZ,                                  -- آخر موعد للتقديم
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول إعلانات الوظائف

        // 9. جدول طلبات التوظيف (طلبات المستخدمين المقدمة على الوظائف)
        await client.query(`CREATE TABLE IF NOT EXISTS job_applications (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد للطلب
            job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE, -- الوظيفة المقدم عليها
            user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE, -- المستخدم الذي قدم الطلب
            file_url TEXT NOT NULL,                                -- رابط ملف السيرة الذاتية (CV) المرفوع
            status TEXT DEFAULT 'pending',                         -- حالة الطلب (pending, accepted, rejected)
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول لاستقبال طلبات التوظيف من المستخدمين

        // 10. جدول الرسوم الدراسية (الخاصة بالأقسام)
        await client.query(`CREATE TABLE IF NOT EXISTS fees (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد للرسم
            department_id UUID NOT NULL REFERENCES departments (id) ON DELETE CASCADE, -- القسم التابع له
            fee_type TEXT NOT NULL,                                -- نوع الرسم (ساعات، تسجيل، دراسة مسائية، الخ)
            amount REAL NOT NULL,                                  -- المبلغ المطلوب
            currency TEXT DEFAULT 'IQD',                           -- العملة (افتراضياً دينار عراقي)
            academic_year TEXT,                                    -- العام الدراسي (مثلاً 2023-2024)
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول بيانات الرسوم الدراسية

        // 11. جدول سجل الأخطاء
        await client.query(`CREATE TABLE IF NOT EXISTS error_logs (
            id UUID PRIMARY KEY,
            message TEXT NOT NULL, 
            stack_trace TEXT, 
            source TEXT, 
            user_id TEXT, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول لتسجيل الأخطاء البرمجية التي تحدث في النظام

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
        )`); // إنشاء جدول الخدمات والروابط المهمة للطلاب

        // 13. جدول الرسائل (نظام الإشعارات والمراسلات الداخلية)
        await client.query(`CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد للرسالة
            sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE, -- مرسل الرسالة (النظام أو مستخدم)
            receiver_id UUID,                                      -- مستلم الرسالة (مستخدم محدد)
            content TEXT NOT NULL,                                 -- نص الرسالة أو الإشعار
            is_read INTEGER DEFAULT 0,                             -- هل تمت القراءة؟ (0: لا)
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول الرسائل للمحادثات أو التواصل

        // 14. جدول معلومات التطبيق والمطور
        await client.query(`CREATE TABLE IF NOT EXISTS about_us (
            id UUID PRIMARY KEY,
            content_ar TEXT,
            content_en TEXT,
            developer_name_ar TEXT,
            developer_name_en TEXT,
            developer_bio_ar TEXT,
            developer_bio_en TEXT,
            developer_image_url TEXT,
            developer_cv_url TEXT
        )`); // إنشاء جدول لتخزين معلومات "عن التطبيق" وبيانات المطور

        // إضافة عمود developer_cv_url إذا لم يكن موجوداً
        await client.query(`
            DO $$
            BEGIN
                IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='about_us' AND column_name='developer_cv_url') THEN
                    ALTER TABLE about_us ADD COLUMN developer_cv_url TEXT;
                END IF;
            END
            $$;
        `);

        // 15. جدول مصفوفة الصلاحيات (الربط بين الأدوار والصلاحيات)
        await client.query(`CREATE TABLE IF NOT EXISTS role_permissions (
            id UUID PRIMARY KEY,                                   -- المعرف الفريد
            role TEXT NOT NULL,                                    -- اسم الدور (e.g., college_admin)
            permission_key TEXT NOT NULL,                          -- كود الصلاحية (e.g., manage_users)
            is_enabled INTEGER DEFAULT 0,                          -- هل هي مفعلة لهذا الدور؟
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(role, permission_key)                           -- منع التكرار لنفس الدور والصلاحية
        )`); // إنشاء جدول يربط الأدوار (Roles) بالصلاحيات المتاحة

        // 16. جدول الصلاحيات الخاصة
        await client.query(`CREATE TABLE IF NOT EXISTS user_permissions (
            id UUID PRIMARY KEY,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            permission_key TEXT NOT NULL,
            is_enabled INTEGER DEFAULT 1,
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول للصلاحيات الممنوحة لمستخدمين محددين بشكل استثنائي

        await client.query('COMMIT'); // إنهاء المعاملة وتثبيت التغييرات في قاعدة البيانات

        // Add performance indexes on high-traffic foreign key columns
        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_colleges_university_id ON colleges(university_id)',
            'CREATE INDEX IF NOT EXISTS idx_departments_college_id ON departments(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_graduates_department_id ON graduates(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_research_department_id ON research(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_college_id ON jobs(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_fees_department_id ON fees(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_announcements_university_id ON announcements(university_id)',
            'CREATE INDEX IF NOT EXISTS idx_announcements_college_id ON announcements(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_announcements_created_at ON announcements(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
            'CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id)',
            'CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at DESC)',
            'CREATE INDEX IF NOT EXISTS idx_research_created_at ON research(created_at DESC)',
        ]; // مصفوفة تحتوي على أوامر إنشاء الفهارس لتحسين سرعة الاستعلامات
        for (const idx of indexes) { // التكرار عبر مصفوفة الفهارس
            try { await pool.query(idx); } catch(e) { /* index may already exist */ } // تنفيذ أمر إنشاء الفهرس وتجاهل الخطأ إذا كان موجوداً
        }

        // backup_logs table for tracking backup operations
        await pool.query(`CREATE TABLE IF NOT EXISTS backup_logs (
            id UUID PRIMARY KEY,
            filename TEXT NOT NULL,
            size_bytes BIGINT,
            status TEXT DEFAULT 'success',
            triggered_by TEXT DEFAULT 'scheduler',
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); // إنشاء جدول لتتبع عمليات النسخ الاحتياطي وحالتها

        // إضافة الأعمدة الجديدة للجداول الموجودة (للتوافق مع قواعد البيانات القديمة)
        try {
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token TEXT`); // محاولة إضافة عمود الرمز إذا لم يوجد
            await pool.query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ`); // محاولة إضافة عمود انتهاء الرمز
        } catch (e) {
            // الأعمدة موجودة بالفعل
        }

        // إدراج البيانات الأساسية بعد اكتمال إنشاء الجداول
        await insertDefaultData(); // استدعاء دالة إدراج البيانات الافتراضية
        console.log('✅ تم الانتهاء من إعداد جداول PostgreSQL.'); // طباعة رسالة نجاح الإعداد
    } catch (e) { // الإمساك بأي خطأ يحدث أثناء العملية
        await client.query('ROLLBACK'); // التراجع عن جميع التغييرات في حال حدوث خطأ
        console.error('❌ فشل في إنشاء الجداول:', e.message); // طباعة رسالة الخطأ
    } finally { // كتلة تنفذ في كل الأحوال
        client.release(); // تحرير عميل الاتصال وإعادته للـ pool
    }
}

/**
 * دالة إدراج البيانات الافتراضية
 */
async function insertDefaultData() { // تعريف دالة إدراج البيانات الأساسية (مثل المدير العام)
    try { // بدء محاولة التنفيذ
        const adminCheck = await pool.query("SELECT count(*) FROM users WHERE role = 'super_admin'"); // التحقق من وجود مدير عام في النظام
        if (parseInt(adminCheck.rows[0].count) === 0) { // إذا لم يوجد مدير عام
            const adminId = uuidv4(); // إنشاء معرف فريد للمدير
            const passwordHash = bcrypt.hashSync('Bilal147', 10); // تشفير كلمة مرور المدير الافتراضية

            await pool.query(
                `INSERT INTO users (id, email, password, full_name, role, is_active) VALUES ($1, $2, $3, $4, $5, $6)`,
                [adminId, 'Belal@admin.com', passwordHash, 'بلال شائف', 'super_admin', 1]
            ); // إدراج بيانات المدير العام في جدول المستخدمين

            console.log('🚀 تم إنشاء حساب المدير العام: Belal@admin.com / Bilal147'); // طباعة بيانات الدخول للتنبيه

            const roles = ['super_admin', 'university_admin', 'college_admin', 'department_admin']; // قائمة الأدوار الإدارية
            const permissions = [
                'manage_universities', 'manage_colleges', 'manage_departments',
                'manage_users', 'manage_announcements', 'manage_jobs',
                'manage_research', 'manage_graduates', 'manage_fees',
                'view_reports', 'advanced_settings'
            ]; // قائمة الصلاحيات المتاحة في النظام (Permissions Matrix)

            for (const role of roles) { // التكرار عبر الأدوار
                for (const perm of permissions) { // التكرار عبر الصلاحيات لكل دور
                    let isEnabled = 0; // القيمة الافتراضية للصلاحية (معطلة)
                    if (role === 'super_admin') isEnabled = 1; // المدير العام يحصل على كافة الصلاحيات
                    else if (role === 'university_admin') { // صلاحيات مدير الجامعة
                        if (['manage_universities', 'manage_colleges', 'manage_departments', 'manage_users', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
                            isEnabled = 1; // منح الصلاحيات المناسبة لمدير الجامعة
                        }
                    } else if (role === 'college_admin') { // صلاحيات مدير الكلية
                        if (['manage_colleges', 'manage_departments', 'manage_users', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
                            isEnabled = 1; // منح الصلاحيات المناسبة لمدير الكلية
                        }
                    } else if (role === 'department_admin') { // صلاحيات مدير القسم
                        // وفقاً للمواصفات: مدير القسم يدير الوظائف والرسوم والأبحاث والخريجين والإعلانات
                        if (['manage_departments', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
                            isEnabled = 1; // منح الصلاحيات المناسبة لمدير القسم
                        }
                    }

                    await pool.query(
                        `INSERT INTO role_permissions (id, role, permission_key, is_enabled) VALUES ($1, $2, $3, $4) ON CONFLICT (role, permission_key) DO NOTHING`,
                        [uuidv4(), role, perm, isEnabled]
                    ); // إدراج العلاقة بين الدور والصلاحية في جدول مصفوفة الصلاحيات
                }
            }
        }
    } catch (e) { // الإمساك بالخطأ
        console.error('❌ خطأ في إدراج البيانات الافتراضية:', e.message); // طباعة الخطأ
    }
}

/**
 * متوافقية مع الـ API المستخدم سابقاً
 */
const db = { // إنشاء كائن db لتسهيل استخدام قاعدة البيانات في باقي أجزاء التطبيق
    query: (text, params) => pool.query(text, params).then(res => res.rows), // وظيفة لتنفيذ استعلام وإرجاع جميع الصفوف
    getAsync: (text, params) => pool.query(text, params).then(res => res.rows[0]), // وظيفة لإرجاع صف واحد فقط (الأول)
    runAsync: (text, params) => pool.query(text, params).then(res => ({ lastID: null, changes: res.rowCount })), // وظيفة لتنفيذ الأوامر (تحديث/حذف) وإرجاع عدد الصفوف المتأثرة
    pool // إتاحة الوصول لكائن pool الأصلي عند الحاجة
};

// تهيئة الجداول عند التشغيل
createTables(); // استدعاء دالة إنشاء الجداول فور تشغيل الملف

module.exports = db; // تصدير كائن db لاستخدامه في الملفات الأخرى
