const { Pool } = require('pg'); 
const bcrypt = require('bcryptjs'); 
const { v4: uuidv4 } = require('uuid'); 

const pool = new Pool({ 
    connectionString: process.env.DATABASE_URL, 
    ssl: process.env.DATABASE_URL?.includes('localhost') ? false : { rejectUnauthorized: false } 
});

pool.on('error', (err) => { 
    console.error('❌ خطأ غير متوقع في قاعدة البيانات:', err); 
});

async function createTables() { 
    const client = await pool.connect(); 
    try { 
        await client.query('BEGIN'); 

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
            reset_token TEXT, 
            reset_token_expires TIMESTAMPTZ, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
            created_by UUID 
        )`); 

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

        await client.query(`CREATE TABLE IF NOT EXISTS job_applications (
            id UUID PRIMARY KEY, 
            job_id UUID NOT NULL REFERENCES jobs (id) ON DELETE CASCADE, 
            user_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE, 
            file_url TEXT NOT NULL, 
            status TEXT DEFAULT 'pending', 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); 

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

        await client.query(`CREATE TABLE IF NOT EXISTS error_logs (
            id UUID PRIMARY KEY, 
            message TEXT NOT NULL, 
            stack_trace TEXT, 
            source TEXT, 
            user_id TEXT, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); 

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

        await client.query(`CREATE TABLE IF NOT EXISTS messages (
            id UUID PRIMARY KEY, 
            sender_id UUID NOT NULL REFERENCES users (id) ON DELETE CASCADE, 
            receiver_id UUID, 
            content TEXT NOT NULL, 
            is_read INTEGER DEFAULT 0, 
            is_edited INTEGER DEFAULT 0, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); 

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
        )`); 

        await client.query(`CREATE TABLE IF NOT EXISTS role_permissions (
            id UUID PRIMARY KEY, 
            role TEXT NOT NULL, 
            permission_key TEXT NOT NULL, 
            is_enabled INTEGER DEFAULT 0, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
            updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP, 
            UNIQUE(role, permission_key) 
        )`); 

        await client.query(`CREATE TABLE IF NOT EXISTS user_permissions (
            id UUID PRIMARY KEY, 
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
            permission_key TEXT NOT NULL, 
            is_enabled INTEGER DEFAULT 1, 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); 

        // Migration: Ensure messages has is_edited column
        try {
            await client.query('ALTER TABLE messages ADD COLUMN IF NOT EXISTS is_edited INTEGER DEFAULT 0');
        } catch (e) {
            // Column might already exist or other error
        }

        // Migration: Ensure research has students column
        try {
            await client.query('ALTER TABLE research ADD COLUMN IF NOT EXISTS students TEXT');
        } catch (e) {
            // Column might already exist
        }

        // Migration: Ensure announcements has file_url column
        try {
            await client.query('ALTER TABLE announcements ADD COLUMN IF NOT EXISTS file_url TEXT');
        } catch (e) {}

        // Migration: Ensure users has cover_url column
        try {
            await client.query('ALTER TABLE users ADD COLUMN IF NOT EXISTS cover_url TEXT');
        } catch (e) {}

        // Migration: Create verification_codes table
        try {
            await client.query(`CREATE TABLE IF NOT EXISTS verification_codes (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                identifier VARCHAR(255) NOT NULL,
                code VARCHAR(10) NOT NULL,
                expires_at TIMESTAMP NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )`);
        } catch (e) {}

        // Migration: Ensure manage_services permission exists for all roles
        const rolesForMigration = ['super_admin', 'university_admin', 'college_admin', 'department_admin'];
        for (const role of rolesForMigration) {
            await client.query(
                `INSERT INTO role_permissions (id, role, permission_key, is_enabled) 
                 VALUES ($1, $2, $3, $4) 
                 ON CONFLICT (role, permission_key) DO NOTHING`,
                [uuidv4(), role, 'manage_services', (role === 'super_admin' || role === 'university_admin') ? 1 : 0]
            );
        }

        await client.query('COMMIT'); 

        const indexes = [
            'CREATE INDEX IF NOT EXISTS idx_colleges_university_id ON colleges(university_id)',
            'CREATE INDEX IF NOT EXISTS idx_departments_college_id ON departments(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_graduates_department_id ON graduates(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_research_department_id ON research(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_jobs_college_id ON jobs(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_fees_department_id ON fees(department_id)',
            'CREATE INDEX IF NOT EXISTS idx_announcements_university_id ON announcements(university_id)',
            'CREATE INDEX IF NOT EXISTS idx_announcements_college_id ON announcements(college_id)',
            'CREATE INDEX IF NOT EXISTS idx_users_role ON users(role)',
            'CREATE INDEX IF NOT EXISTS idx_users_university_id ON users(university_id)',
            'CREATE INDEX IF NOT EXISTS idx_users_college_id ON users(college_id)',
        ]; 
        for (const idx of indexes) { 
            try { await pool.query(idx); } catch(e) {} 
        }

        await pool.query(`CREATE TABLE IF NOT EXISTS backup_logs (
            id UUID PRIMARY KEY, 
            filename TEXT NOT NULL, 
            size_bytes BIGINT, 
            status TEXT DEFAULT 'success', 
            triggered_by TEXT DEFAULT 'scheduler', 
            created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
        )`); 

        await insertDefaultData(); 
        console.log('✅ تم الانتهاء من إعداد جداول PostgreSQL.'); 
    } catch (e) { 
        await client.query('ROLLBACK'); 
        console.error('❌ فشل في إنشاء الجداول:', e.message); 
    } finally { 
        client.release(); 
    }
}

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
                'manage_services', 'view_reports', 'advanced_settings'
            ]; 

            for (const role of roles) { 
                for (const perm of permissions) { 
                    let isEnabled = 0; 
                    if (role === 'super_admin') isEnabled = 1; 
                    else if (role === 'university_admin') { 
                        if (['manage_universities', 'manage_colleges', 'manage_departments', 'manage_users', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees', 'manage_services'].includes(perm)) {
                            isEnabled = 1; 
                        }
                    } else if (role === 'college_admin') { 
                        if (['manage_colleges', 'manage_departments', 'manage_users', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
                            isEnabled = 1; 
                        }
                    } else if (role === 'department_admin') { 
                        if (['manage_departments', 'manage_announcements', 'manage_jobs', 'manage_research', 'manage_graduates', 'manage_fees'].includes(perm)) {
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

const db = { 
    query: (text, params) => pool.query(text, params).then(res => res.rows), 
    getAsync: (text, params) => pool.query(text, params).then(res => res.rows[0]), 
    runAsync: (text, params) => pool.query(text, params).then(res => ({ lastID: null, changes: res.rowCount })), 
    pool 
};

createTables(); 
module.exports = db;
