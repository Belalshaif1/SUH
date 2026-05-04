const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');
const path = require('path');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const isPostgres = process.env.DATABASE_URL && (process.env.DATABASE_URL.startsWith('postgres://') || process.env.DATABASE_URL.startsWith('postgresql://'));

let db_conn;
let pool;

if (isPostgres) {
    console.log('🐘 استخدام قاعدة بيانات PostgreSQL');
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    const dbPath = path.join(__dirname, 'database.sqlite');
    db_conn = new sqlite3.Database(dbPath);
    console.log('📦 استخدام قاعدة بيانات SQLite:', dbPath);
}

// Wrapper to support PostgreSQL-style parameters ($1, $2) and Promises
const runQuery = (sql, params = []) => {
    if (isPostgres) {
        return pool.query(sql, params).then(res => res.rows);
    }
    return new Promise((resolve, reject) => {
        const convertedSql = sql.replace(/\$\d+/g, '?');
        db_conn.all(convertedSql, params, (err, rows) => {
            if (err) reject(err);
            else resolve(rows);
        });
    });
};

const getRow = (sql, params = []) => {
    if (isPostgres) {
        return pool.query(sql, params).then(res => res.rows[0]);
    }
    return new Promise((resolve, reject) => {
        const convertedSql = sql.replace(/\$\d+/g, '?');
        db_conn.get(convertedSql, params, (err, row) => {
            if (err) reject(err);
            else resolve(row);
        });
    });
};

const runAsync = (sql, params = []) => {
    if (isPostgres) {
        // Postgres uses 'INSERT ... RETURNING id' if needed, but for general compatibility:
        return pool.query(sql, params).then(res => ({ lastID: null, changes: res.rowCount }));
    }
    return new Promise((resolve, reject) => {
        const convertedSql = sql.replace(/\$\d+/g, '?');
        db_conn.run(convertedSql, params, function(err) {
            if (err) reject(err);
            else resolve({ lastID: this.lastID, changes: this.changes });
        });
    });
};

async function createTables() {
    try {
        if (!isPostgres) await runAsync('BEGIN TRANSACTION');

        const userTable = `CREATE TABLE IF NOT EXISTS users ( 
            id TEXT PRIMARY KEY, 
            email TEXT UNIQUE, 
            password TEXT NOT NULL, 
            full_name TEXT, 
            avatar_url TEXT, 
            phone TEXT, 
            is_active INTEGER DEFAULT 1, 
            role TEXT DEFAULT 'user', 
            university_id TEXT, 
            college_id TEXT, 
            department_id TEXT, 
            reset_token TEXT, 
            reset_token_expires TEXT, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            created_by TEXT,
            cover_url TEXT
        )`;

        await runAsync(userTable);

        await runAsync(`CREATE TABLE IF NOT EXISTS universities (
            id TEXT PRIMARY KEY, 
            name_ar TEXT NOT NULL, 
            name_en TEXT, 
            description_ar TEXT, 
            description_en TEXT, 
            guide_pdf_url TEXT, 
            logo_url TEXT, 
            is_pinned INTEGER DEFAULT 0, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP 
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS colleges (
            id TEXT PRIMARY KEY, 
            university_id TEXT NOT NULL REFERENCES universities (id) ON DELETE CASCADE, 
            name_ar TEXT NOT NULL, 
            name_en TEXT, 
            description_ar TEXT, 
            description_en TEXT, 
            guide_pdf_url TEXT, 
            logo_url TEXT, 
            is_pinned INTEGER DEFAULT 0, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS departments (
            id TEXT PRIMARY KEY, 
            college_id TEXT NOT NULL REFERENCES colleges (id) ON DELETE CASCADE, 
            name_ar TEXT NOT NULL, 
            name_en TEXT, 
            description_ar TEXT, 
            description_en TEXT, 
            study_plan_url TEXT, 
            logo_url TEXT, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS announcements (
            id TEXT PRIMARY KEY, 
            title_ar TEXT NOT NULL, 
            title_en TEXT, 
            content_ar TEXT NOT NULL, 
            content_en TEXT, 
            scope TEXT DEFAULT 'global', 
            university_id TEXT REFERENCES universities (id) ON DELETE CASCADE, 
            college_id TEXT REFERENCES colleges (id) ON DELETE CASCADE, 
            image_url TEXT, 
            file_url TEXT, 
            is_pinned INTEGER DEFAULT 0, 
            created_by TEXT REFERENCES users (id) ON DELETE SET NULL, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS graduates (
            id TEXT PRIMARY KEY, 
            department_id TEXT NOT NULL REFERENCES departments (id) ON DELETE CASCADE, 
            full_name_ar TEXT NOT NULL, 
            full_name_en TEXT, 
            graduation_year INTEGER NOT NULL, 
            gpa REAL, 
            specialization_ar TEXT, 
            specialization_en TEXT, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS research (
            id TEXT PRIMARY KEY, 
            department_id TEXT NOT NULL REFERENCES departments (id) ON DELETE CASCADE, 
            title_ar TEXT NOT NULL, 
            title_en TEXT, 
            abstract_ar TEXT, 
            abstract_en TEXT, 
            author_name TEXT NOT NULL, 
            published INTEGER DEFAULT 1, 
            publish_date TEXT, 
            pdf_url TEXT, 
            students TEXT, 
            is_pinned INTEGER DEFAULT 0,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS jobs (
            id TEXT PRIMARY KEY, 
            college_id TEXT NOT NULL REFERENCES colleges (id) ON DELETE CASCADE, 
            title_ar TEXT NOT NULL, 
            title_en TEXT, 
            description_ar TEXT NOT NULL, 
            description_en TEXT, 
            requirements_ar TEXT, 
            requirements_en TEXT, 
            is_active INTEGER DEFAULT 1, 
            is_pinned INTEGER DEFAULT 0, 
            deadline TEXT, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS job_applications (
            id TEXT PRIMARY KEY, 
            job_id TEXT NOT NULL REFERENCES jobs (id) ON DELETE CASCADE, 
            user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE, 
            file_url TEXT NOT NULL, 
            status TEXT DEFAULT 'pending', 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS fees (
            id TEXT PRIMARY KEY, 
            department_id TEXT NOT NULL REFERENCES departments (id) ON DELETE CASCADE, 
            fee_type TEXT NOT NULL, 
            amount REAL NOT NULL, 
            currency TEXT DEFAULT 'IQD', 
            academic_year TEXT, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS error_logs (
            id TEXT PRIMARY KEY, 
            message TEXT NOT NULL, 
            stack_trace TEXT, 
            source TEXT, 
            user_id TEXT, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS services (
            id TEXT PRIMARY KEY, 
            title_ar TEXT NOT NULL, 
            title_en TEXT, 
            description_ar TEXT, 
            description_en TEXT, 
            icon TEXT, 
            link TEXT, 
            is_active INTEGER DEFAULT 1, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS messages (
            id TEXT PRIMARY KEY, 
            sender_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE, 
            receiver_id TEXT, 
            content TEXT NOT NULL, 
            is_read INTEGER DEFAULT 0, 
            is_edited INTEGER DEFAULT 0, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS about_us (
            id TEXT PRIMARY KEY, 
            content_ar TEXT, 
            content_en TEXT, 
            developer_name_ar TEXT, 
            developer_name_en TEXT, 
            developer_bio_ar TEXT, 
            developer_bio_en TEXT, 
            developer_image_url TEXT, 
            developer_cv_url TEXT
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS role_permissions (
            id TEXT PRIMARY KEY, 
            role TEXT NOT NULL, 
            permission_key TEXT NOT NULL, 
            is_enabled INTEGER DEFAULT 0, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP, 
            UNIQUE(role, permission_key) 
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS user_permissions (
            id TEXT PRIMARY KEY, 
            user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE, 
            permission_key TEXT NOT NULL, 
            is_enabled INTEGER DEFAULT 1, 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        await runAsync(`CREATE TABLE IF NOT EXISTS verification_codes (
            id TEXT PRIMARY KEY,
            identifier TEXT NOT NULL,
            code TEXT NOT NULL,
            expires_at TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`);

        await runAsync(`CREATE TABLE IF NOT EXISTS backup_logs (
            id TEXT PRIMARY KEY, 
            filename TEXT NOT NULL, 
            size_bytes INTEGER, 
            status TEXT DEFAULT 'success', 
            triggered_by TEXT DEFAULT 'scheduler', 
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )`); 

        if (!isPostgres) await runAsync('COMMIT'); 

        // SQL indexes (Works for both SQLite and Postgres)
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
            try { await runAsync(idx); } catch(e) {} 
        }

        // Migration: Ensure manage_services permission exists for all roles
        const rolesForMigration = ['super_admin', 'university_admin', 'college_admin', 'department_admin'];
        for (const role of rolesForMigration) {
            const conflictClause = isPostgres ? 'ON CONFLICT (role, permission_key) DO NOTHING' : '';
            const insertSql = isPostgres 
                ? `INSERT INTO role_permissions (id, role, permission_key, is_enabled) VALUES ($1, $2, $3, $4) ${conflictClause}`
                : `INSERT OR IGNORE INTO role_permissions (id, role, permission_key, is_enabled) VALUES ($1, $2, $3, $4)`;
            
            await runAsync(
                insertSql,
                [uuidv4(), role, 'manage_services', (role === 'super_admin' || role === 'university_admin') ? 1 : 0]
            );
        }

        await insertDefaultData(); 
        console.log(`✅ تم الانتهاء من إعداد جداول ${isPostgres ? 'PostgreSQL' : 'SQLite'}.`); 
    } catch (e) { 
        if (!isPostgres) try { await runAsync('ROLLBACK'); } catch(rollErr) {}
        console.error('❌ فشل في إنشاء الجداول:', e.message); 
    }
}

async function insertDefaultData() { 
    try { 
        const adminCheck = await getRow("SELECT count(*) as count FROM users WHERE role = 'super_admin'"); 
        if (parseInt(adminCheck.count) === 0) { 
            const adminId = uuidv4(); 
            const passwordHash = bcrypt.hashSync('Bilal147', 10); 

            await runAsync(
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

                    const conflictClause = isPostgres ? 'ON CONFLICT (role, permission_key) DO NOTHING' : '';
                    const insertSql = isPostgres 
                        ? `INSERT INTO role_permissions (id, role, permission_key, is_enabled) VALUES ($1, $2, $3, $4) ${conflictClause}`
                        : `INSERT OR IGNORE INTO role_permissions (id, role, permission_key, is_enabled) VALUES ($1, $2, $3, $4)`;

                    await runAsync(
                        insertSql,
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
    query: runQuery, 
    getAsync: getRow, 
    runAsync: runAsync, 
    close: () => new Promise((resolve, reject) => {
        if (isPostgres) {
            pool.end().then(resolve).catch(reject);
        } else {
            db_conn.close((err) => {
                if (err) reject(err);
                else resolve();
            });
        }
    })
};

createTables(); 
module.exports = db;

