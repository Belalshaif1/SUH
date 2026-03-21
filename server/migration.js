const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false }
});

async function migrate() {
    const client = await pool.connect();
    try {
        console.log('🚀 بدء عملية تحديث قاعدة البيانات (Migration)...');

        const commands = [
            // الجامعات
            "ALTER TABLE universities ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0",
            "ALTER TABLE universities ADD COLUMN IF NOT EXISTS description_ar TEXT",
            "ALTER TABLE universities ADD COLUMN IF NOT EXISTS description_en TEXT",
            "ALTER TABLE universities ADD COLUMN IF NOT EXISTS guide_pdf_url TEXT",
            "ALTER TABLE universities ADD COLUMN IF NOT EXISTS logo_url TEXT",
            
            // الكليات
            "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0",
            "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS description_ar TEXT",
            "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS description_en TEXT",
            "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS guide_pdf_url TEXT",
            "ALTER TABLE colleges ADD COLUMN IF NOT EXISTS logo_url TEXT",

            // الأقسام
            "ALTER TABLE departments ADD COLUMN IF NOT EXISTS description_ar TEXT",
            "ALTER TABLE departments ADD COLUMN IF NOT EXISTS description_en TEXT",
            "ALTER TABLE departments ADD COLUMN IF NOT EXISTS study_plan_url TEXT",
            "ALTER TABLE departments ADD COLUMN IF NOT EXISTS logo_url TEXT",

            // الإعلانات
            "ALTER TABLE announcements ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0",
            
            // الوظائف
            "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0",

            // الأبحاث
            "ALTER TABLE research ADD COLUMN IF NOT EXISTS is_pinned INTEGER DEFAULT 0",

            // المستخدمين
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT",
            "ALTER TABLE users ADD COLUMN IF NOT EXISTS phone TEXT"
        ];

        for (const sql of commands) {
            try {
                await client.query(sql);
                console.log(`✅ نفذ بنجاح: ${sql}`);
            } catch (err) {
                console.error(`❌ فشل في التنفيذ (${sql}):`, err.message);
            }
        }

        console.log('✨ انتهت الهجرة بنجاح.');
    } catch (e) {
        console.error('❌ خطأ فادح أثناء الهجرة:', e);
    } finally {
        client.release();
        await pool.end();
    }
}

migrate();
